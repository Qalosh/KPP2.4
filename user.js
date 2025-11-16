// --- Частина 1: Керування користувачами та кімнатами (перенесено з sidebar.js) ---

// Запрошення користувача в кімнату
async function inviteUserToRoom() {
    if (!this.inviteUser.trim() || !this.roomId) return;
    
    try {
        const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({ user_id: this.inviteUser.trim() })
        });
        
        if (res.ok) {
            this.error = `User ${this.inviteUser.trim()} invited!`;
            this.inviteUser = '';
        } else {
            const data = await res.json();
            this.error = data.error || 'Invite failed';
        }
    } catch (e) {
        this.error = 'Invite network error: ' + e.message;
    }
}

// Приєднання до кімнати за ID
async function joinRoom(roomIdToJoin = null) { 
    const room = roomIdToJoin || this.joinRoomId.trim();

    if (!room) return;

    try {
        const res = await fetch(`https://matrix.org/_matrix/client/r0/join/${encodeURIComponent(room)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        
        const data = await res.json();

        if (data.room_id) {
            this.error = `Successfully joined room ${data.room_id}!`;
            this.joinRoomId = '';
            await this.fetchRoomsWithNames(); 
            this.switchRoom(data.room_id); 
        } else {
            this.error = data.error || 'Join failed';
        }
    } catch (e) {
        this.error = 'Join room network error: ' + e.message;
    }
}

// --- Частина 2: Отримання учасників кімнати (НОВА ФУНКЦІЯ) ---
async function fetchRoomMembers() {
    if (!this.accessToken || !this.roomId) return;
    this.roomMembers = []; 
    
    try {
        const res = await fetch(
            `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/joined_members`,
            {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );
        const data = await res.json();
        
        this.roomMembers = Object.entries(data.joined || {}).map(([userId, info]) => ({
            userId,
            displayName: info.display_name || userId.split(':')[0].substring(1),
            avatarUrl: info.avatar_url
        }));
    } catch (e) {
        console.error('Error fetching room members:', e);
    }
}