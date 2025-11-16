// --- Частина 1: Відправка повідомлення ---
async function sendMessage() {
    if (!this.newMessage.trim() || !this.roomId) {
        console.warn('Cannot send: No message or room selected.');
        return;
    }

    const msg = this.newMessage.trim();
    this.newMessage = ''; 

    try {
        const txnId = Date.now(); 
        const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/send/m.room.message/${txnId}`, {
            method: 'PUT', // PUT для надійності
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({ msgtype: 'm.text', body: msg })
        });

        const data = await res.json();
        
        if (data.event_id) {
            // Оптимістичне оновлення UI
            this.messages.push({ 
                id: data.event_id, 
                body: msg, 
                sender: this.userId 
            });
            this.$nextTick(() => {
                const messagesDiv = document.getElementById('messages');
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            });
        } else {
            console.error('Send failed:', data);
        }
    } catch (e) {
        console.error('Send message error:', e);
    }
}

// --- Частина 2: Отримання повідомлень (Синхронізація) ---
async function fetchMessages() {
    if (!this.accessToken) return;

    try {
        // Довге опитування (long polling) для отримання оновлень
        const url = `https://matrix.org/_matrix/client/r0/sync?timeout=30000${this.lastSyncToken ? '&since=' + this.lastSyncToken : ''}`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        const data = await res.json();

        if (data.next_batch) {
            this.lastSyncToken = data.next_batch; 

            // Обробка нових повідомлень
            if (this.roomId && data.rooms?.join?.[this.roomId]) {
                const roomData = data.rooms.join[this.roomId];
                
                roomData.timeline?.events?.forEach(event => {
                    if (event.type === 'm.room.message' && event.content?.body && !this.messages.find(m => m.id === event.event_id)) {
                        this.messages.push({
                            id: event.event_id,
                            body: event.content.body,
                            sender: event.sender
                        });
                    }
                });
            }

            // Автоматичне приєднання до кімнат за запрошенням
            if (data.rooms?.invite) {
                for (const roomId of Object.keys(data.rooms.invite)) {
                    await this.joinRoom(roomId); 
                }
            }

            await this.fetchRoomsWithNames(); 

            // Прокрутка вниз, якщо були нові повідомлення
            if (data.rooms?.join?.[this.roomId]?.timeline?.events?.length > 0) {
                this.$nextTick(() => {
                    const messagesDiv = document.getElementById('messages');
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                });
            }
        }
    } catch (e) {
        console.error('Fetch messages error:', e);
    }

    // Рекурсивний виклик для постійної синхронізації
    if (this.accessToken) {
        setTimeout(() => this.fetchMessages(), 500); 
    }
}