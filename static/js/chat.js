
// static/js/chat.js

class ChatApp {
    constructor(roomId) {
        this.roomId = roomId;
        this.supabase = window.supabase;
        this.messages = [];
        this.messagesContainer = null;
        this.messageInput = null;
        this.sendButton = null;

        this.initializeUI();
        this.fetchInitialMessages();
        this.setupRealtimeSubscriptions();
    }

    initializeUI() {
        this.messagesContainer = document.getElementById('messageContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.querySelector('.send-btn');

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async fetchInitialMessages() {
        const { data, error } = await this.supabase
            .from('messages')
            .select('*, users:user_id (*)')
            .eq('room_id', this.roomId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        this.messages = data.reverse();
        this.renderMessages();
    }

    setupRealtimeSubscriptions() {
        // Subscription for new messages
        this.supabase
            .channel(`messages:room=${this.roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${this.roomId}`
            }, payload => {
                this.messages.push(payload.new);
                this.renderMessages();
            })
            .subscribe();
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;

        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
            console.error('User not authenticated');
            return;
        }

        const { error } = await this.supabase
            .from('messages')
            .insert([{
                room_id: this.roomId,
                user_id: user.id,
                content: content
            }]);

        if (error) {
            console.error('Error sending message:', error);
            return;
        }

        this.messageInput.value = '';
    }

    renderMessages() {
        const { data: { user } } = this.supabase.auth.getUser();
        this.messagesContainer.innerHTML = this.messages.map(msg => {
            const sender = msg.user_id === user.id ? 'sent' : 'received';
            return `
                <div class="message ${sender}">
                    <div class="message-bubble">${msg.content}</div>
                </div>
            `;
        }).join('');
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    destroy() {
        this.supabase.channel(`messages:room=${this.roomId}`).unsubscribe();
    }
}
