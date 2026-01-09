// static/js/chat.js

class ChatApp {
    constructor(roomId, currentUser) {
        this.supabase = window.supabase; // Assumes Supabase client is globally available (from supabase_init.js)
        this.roomId = roomId;
        this.currentUser = currentUser;

        // Channels to be unsubscribed from later
        this.messagesChannel = null;
        this.presenceChannel = null;

        // HTML elements
        this.messageContainer = document.getElementById('messageContainer');
        this.avatarStackEl = document.getElementById('avatarStack');
        this.messageForm = document.getElementById('messageForm'); // Ensure your form has this ID
        this.messageInput = document.getElementById('messageInput');

        this.init();
    }

    // --- Core Initialization ---
    async init() {
        // 1. Initial Load (History)
        await this.loadInitialMessages();

        // 2. Realtime Subscriptions
        this.subscribeToMessages();
        this.subscribeToPresence();
        // static/js/chat.js

        class ChatApp {
            constructor(roomId, currentUser) {
                this.supabase = window.supabase; // Assumes Supabase client is globally available (from supabase_init.js)
                this.roomId = roomId;
                this.currentUser = currentUser;

                // Channels to be unsubscribed from later
                this.messagesChannel = null;
                this.presenceChannel = null;

                // HTML elements
                this.messageContainer = document.getElementById('messageContainer');
                this.avatarStackEl = document.getElementById('avatarStack');
                this.messageForm = document.getElementById('messageForm'); // Ensure your form has this ID
                this.messageInput = document.getElementById('messageInput');

                this.init();
            }

            // --- Core Initialization ---
            async init() {
                // 1. Initial Load (History)
                await this.loadInitialMessages();

                // 2. Realtime Subscriptions
                this.subscribeToMessages();
                this.subscribeToPresence();

                // 3. Setup send message handler
                if (this.messageForm) {
                    this.messageForm.addEventListener('submit', this.handleSendMessage.bind(this));
                }

                // 4. Setup cleanup on page exit
                window.addEventListener('beforeunload', this.unsubscribeAll.bind(this));
            }

            // --- Data Fetching ---
            async loadInitialMessages() {
                // Fetch message history and join with the profiles table to get avatar/username
                const { data: messages, error } = await this.supabase
                    .from('messages')
                    .select(`
                *,
                profiles:user_id (username, avatar_url)
            `)
                    .eq('room_id', this.roomId)
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (error) {
                    console.error('Error loading initial messages:', error);
                    return;
                }

                messages.forEach(msg => this.appendMessage(msg));
                this.scrollToBottom();
            }

            // --- Realtime Messaging (The Core Chat Feature) ---
            subscribeToMessages() {
                this.messagesChannel = this.supabase
                    .channel('room-' + this.roomId)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'messages',
                            filter: `room_id=eq.${this.roomId}`
                        },
                        async (payload) => {
                            // Fetch the associated user profile data to display the avatar/name for the new message
                            const { data: message, error } = await this.supabase
                                .from('messages')
                                .select(`*, profiles:user_id (username, avatar_url)`)
                                .eq('id', payload.new.id)
                                .single();

                            if (message) {
                                this.appendMessage(message);
                            }
                        }
                    )
                    .subscribe();
                console.log('Realtime message channel subscribed.');
            }


            // --- Presence (Real-time Avatar Stack Feature) ---
            subscribeToPresence() {
                this.presenceChannel = this.supabase
                    .channel(`presence:room:${this.roomId}`, {
                        config: { presence: { key: this.roomId } }
                    })
                    .on('presence', { event: 'sync' }, () => {
                        const presenceState = this.presenceChannel.presenceState();
                        const activeUsers = [];

                        // Flatten the presence state into a single list of users
                        for (const key in presenceState) {
                            presenceState[key].forEach(user => activeUsers.push(user));
                        }

                        this.renderAvatarStack(activeUsers);
                    })
                    .subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            // Start tracking the current user with their profile data (needed for the stack)
                            await this.presenceChannel.track({
                                user_id: this.currentUser.id,
                                // Pull user metadata from the Supabase Auth user object
                                username: this.currentUser.user_metadata.full_name || this.currentUser.email,
                                avatar_url: this.currentUser.user_metadata.avatar_url || 'https://via.placeholder.com/40',
                            });
                        }
                    });
                console.log('Realtime presence channel subscribed.');
            }

            // --- Message Sending ---
            async handleSendMessage(e) {
                e.preventDefault();
                const content = this.messageInput.value.trim();

                if (!content) return;

                this.messageInput.value = ''; // Clear input immediately for better UX

                const message = {
                    room_id: this.roomId,
                    user_id: this.currentUser.id,
                    content: content
                };

                // Send via INSERT. The message will appear in the UI when the Realtime listener triggers.
                const { error } = await this.supabase.from('messages').insert(message);

                if (error) {
                    console.error('Error sending message:', error);
                    // Restore content on failure
                    this.messageInput.value = content;
                }
            }


            // --- Rendering Logic ---
            appendMessage(message) {
                if (!this.messageContainer) return;

                // Use the joined profile data
                const author = message.profiles || { username: 'Unknown User', avatar_url: 'https://via.placeholder.com/40' };

                const isSelf = message.user_id === this.currentUser.id;
                const messageClass = isSelf ? 'message-self' : 'message-other';

                const messageHTML = `
            <div class="message-bubble ${messageClass}">
                <img src="${author.avatar_url}" alt="${author.username}" class="message-avatar">
                <div class="message-content">
                    <span class="message-author">${author.username}</span>
                    <p>${this.escapeHTML(message.content)}</p>
                    <span class="message-time">${new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        `;

                this.messageContainer.insertAdjacentHTML('beforeend', messageHTML);

                // Scroll to bottom if near the bottom
                if (this.messageContainer.scrollTop + this.messageContainer.clientHeight >= this.messageContainer.scrollHeight - 100) {
                    this.scrollToBottom();
                }
            }

            renderAvatarStack(users) {
                if (!this.avatarStackEl) return;

                // Filter out the current user and get unique users (in case of multiple tabs)
                const uniqueUsers = users.reduce((map, user) => map.set(user.user_id, user), new Map()).values();
                const displayUsers = Array.from(uniqueUsers).filter(user => user.user_id !== this.currentUser.id);

                // Limit to 3 avatars and show a count for the rest
                const limitedUsers = displayUsers.slice(0, 3);
                const remainingCount = displayUsers.length - limitedUsers.length;

                let stackHTML = '';
                limitedUsers.forEach(user => {
                    stackHTML += `<img src="${user.avatar_url}" alt="${user.username}" title="${user.username} is active" class="avatar-stack-img">`;
                });

                if (remainingCount > 0) {
                    stackHTML += `<span class="avatar-stack-count" title="${remainingCount} more active users">+${remainingCount}</span>`;
                }

                this.avatarStackEl.innerHTML = stackHTML;
            }

            // --- Utility Methods ---
            scrollToBottom() {
                this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
            }

            unsubscribeAll() {
                if (this.messagesChannel) {
                    this.messagesChannel.unsubscribe();
                    console.log('Realtime message channel unsubscribed.');
                }
                if (this.presenceChannel) {
                    this.presenceChannel.untrack();
                    this.presenceChannel.unsubscribe();
                    console.log('Realtime presence channel unsubscribed.');
                }
            }

            escapeHTML(str) {
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }

            // Expose destroy method for potential external cleanup
            destroy() {
                this.unsubscribeAll();
                if (this.messageForm) {
                    this.messageForm.removeEventListener('submit', this.handleSendMessage.bind(this));
                }
                window.removeEventListener('beforeunload', this.unsubscribeAll.bind(this));
            }
        }
        // 3. Setup send message handler
        if (this.messageForm) {
            this.messageForm.addEventListener('submit', this.handleSendMessage.bind(this));
        }

        // 4. Setup cleanup on page exit
        window.addEventListener('beforeunload', this.unsubscribeAll.bind(this));
    }

    // --- Data Fetching ---
    async loadInitialMessages() {
        // Fetch message history and join with the profiles table to get avatar/username
        const { data: messages, error } = await this.supabase
            .from('messages')
            .select(`
                *,
                profiles:user_id (username, avatar_url)
            `)
            .eq('room_id', this.roomId)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Error loading initial messages:', error);
            return;
        }

        messages.forEach(msg => this.appendMessage(msg));
        this.scrollToBottom();
    }

    // --- Realtime Messaging (The Core Chat Feature) ---
    subscribeToMessages() {
        this.messagesChannel = this.supabase
            .channel('room-' + this.roomId)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${this.roomId}`
                },
                async (payload) => {
                    // Fetch the associated user profile data to display the avatar/name for the new message
                    const { data: message, error } = await this.supabase
                        .from('messages')
                        .select(`*, profiles:user_id (username, avatar_url)`)
                        .eq('id', payload.new.id)
                        .single();

                    if (message) {
                        this.appendMessage(message);
                    }
                }
            )
            .subscribe();
        console.log('Realtime message channel subscribed.');
    }


    // --- Presence (Real-time Avatar Stack Feature) ---
    subscribeToPresence() {
        this.presenceChannel = this.supabase
            .channel(`presence:room:${this.roomId}`, {
                config: { presence: { key: this.roomId } }
            })
            .on('presence', { event: 'sync' }, () => {
                const presenceState = this.presenceChannel.presenceState();
                const activeUsers = [];

                // Flatten the presence state into a single list of users
                for (const key in presenceState) {
                    presenceState[key].forEach(user => activeUsers.push(user));
                }

                this.renderAvatarStack(activeUsers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Start tracking the current user with their profile data (needed for the stack)
                    await this.presenceChannel.track({
                        user_id: this.currentUser.id,
                        // Pull user metadata from the Supabase Auth user object
                        username: this.currentUser.user_metadata.full_name || this.currentUser.email,
                        avatar_url: this.currentUser.user_metadata.avatar_url || 'https://via.placeholder.com/40',
                    });
                }
            });
        console.log('Realtime presence channel subscribed.');
    }

    // --- Message Sending ---
    async handleSendMessage(e) {
        e.preventDefault();
        const content = this.messageInput.value.trim();

        if (!content) return;

        this.messageInput.value = ''; // Clear input immediately for better UX

        const message = {
            room_id: this.roomId,
            user_id: this.currentUser.id,
            content: content
        };

        // Send via INSERT. The message will appear in the UI when the Realtime listener triggers.
        const { error } = await this.supabase.from('messages').insert(message);

        if (error) {
            console.error('Error sending message:', error);
            // Restore content on failure
            this.messageInput.value = content;
        }
    }


    // --- Rendering Logic ---
    appendMessage(message) {
        if (!this.messageContainer) return;

        // Use the joined profile data
        const author = message.profiles || { username: 'Unknown User', avatar_url: 'https://via.placeholder.com/40' };

        const isSelf = message.user_id === this.currentUser.id;
        const messageClass = isSelf ? 'message-self' : 'message-other';

        const messageHTML = `
            <div class="message-bubble ${messageClass}">
                <img src="${author.avatar_url}" alt="${author.username}" class="message-avatar">
                <div class="message-content">
                    <span class="message-author">${author.username}</span>
                    <p>${this.escapeHTML(message.content)}</p>
                    <span class="message-time">${new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        `;

        this.messageContainer.insertAdjacentHTML('beforeend', messageHTML);

        // Scroll to bottom if near the bottom
        if (this.messageContainer.scrollTop + this.messageContainer.clientHeight >= this.messageContainer.scrollHeight - 100) {
            this.scrollToBottom();
        }
    }

    renderAvatarStack(users) {
        if (!this.avatarStackEl) return;

        // Filter out the current user and get unique users (in case of multiple tabs)
        const uniqueUsers = users.reduce((map, user) => map.set(user.user_id, user), new Map()).values();
        const displayUsers = Array.from(uniqueUsers).filter(user => user.user_id !== this.currentUser.id);

        // Limit to 3 avatars and show a count for the rest
        const limitedUsers = displayUsers.slice(0, 3);
        const remainingCount = displayUsers.length - limitedUsers.length;

        let stackHTML = '';
        limitedUsers.forEach(user => {
            stackHTML += `<img src="${user.avatar_url}" alt="${user.username}" title="${user.username} is active" class="avatar-stack-img">`;
        });

        if (remainingCount > 0) {
            stackHTML += `<span class="avatar-stack-count" title="${remainingCount} more active users">+${remainingCount}</span>`;
        }

        this.avatarStackEl.innerHTML = stackHTML;
    }

    // --- Utility Methods ---
    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    unsubscribeAll() {
        if (this.messagesChannel) {
            this.messagesChannel.unsubscribe();
            console.log('Realtime message channel unsubscribed.');
        }
        if (this.presenceChannel) {
            this.presenceChannel.untrack();
            this.presenceChannel.unsubscribe();
            console.log('Realtime presence channel unsubscribed.');
        }
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Expose destroy method for potential external cleanup
    destroy() {
        this.unsubscribeAll();
        if (this.messageForm) {
            this.messageForm.removeEventListener('submit', this.handleSendMessage.bind(this));
        }
        window.removeEventListener('beforeunload', this.unsubscribeAll.bind(this));
    }
}