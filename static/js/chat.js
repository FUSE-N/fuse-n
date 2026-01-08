
// static/js/chat.js

class ChatApp {
    constructor(roomId, user) {
        this.roomId = roomId;
        this.user = user;
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

        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    async fetchInitialMessages() {
        const { data, error } = await this.supabase
            .from('messages')
            .select('*')
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
                // Check if the message is already in our list to avoid duplicates
                if (!this.messages.find(m => m.id === payload.new.id)) {
                    this.messages.push(payload.new);
                    this.renderMessages();
                }
            })
            .subscribe();
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;

        const { error } = await this.supabase
            .from('messages')
            .insert([{
                room_id: this.roomId,
                user_id: this.user.id,
                content: content
            }]);

        if (error) {
            console.error('Error sending message:', error);
            return;
        }

        this.messageInput.value = '';
    }

    renderMessages() {
        if (!this.messagesContainer) return;
        
        this.messagesContainer.innerHTML = this.messages.map(msg => {
            const senderClass = msg.user_id === this.user.id ? 'sent' : 'received';
            return `
                <div class="message ${senderClass}">
                    <div class="message-bubble">${this.escapeHTML(msg.content)}</div>
                </div>
            `;
        }).join('');
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    destroy() {
        this.supabase.channel(`messages:room=${this.roomId}`).unsubscribe();
    }
}
