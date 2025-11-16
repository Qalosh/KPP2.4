// --- Частина 1: Керування кімнатами ---
async function createRoom() {
    if (!this.newRoomName.trim()) return;

    try {
        const res = await fetch('https://matrix.org/_matrix/client/r0/createRoom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({
                name: this.newRoomName.trim(),
                room_alias_name: this.newRoomName.trim().toLowerCase().replace(/\s/g, '_'),
                visibility: 'private' 
            })
        });

        const data = await res.json();
        
        if (data.room_id) {
            this.newRoomName = '';
            this.error = '';
            await this.fetchRoomsWithNames();
            this.switchRoom(data.room_id); 
        } else {
            this.error = data.error || 'Room creation failed';
        }
    } catch (e) {
        this.error = 'Network error: ' + e.message;
    }
}

async function fetchRoomsWithNames() {
    if (!this.accessToken) return;

    try {
        const res = await fetch('https://matrix.org/_matrix/client/r0/joined_rooms', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        const joinedRoomsData = await res.json();
        const joinedRoomIds = joinedRoomsData.joined_rooms || [];
        
        const roomDetails = [];
        
        for (const id of joinedRoomIds) {
            try {
                // Запит імені кімнати
                const stateRes = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(id)}/state/m.room.name`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                const nameData = await stateRes.json();
                
                roomDetails.push({
                    roomId: id,
                    name: nameData.name || 'Unnamed Room', 
                });
            } catch (e) {
                roomDetails.push({ roomId: id, name: id }); 
            }
        }

        this.rooms = roomDetails;
        
    } catch (e) {
        this.error = 'Failed to fetch rooms: ' + e.message;
    }
}

// --- Частина 2: Взаємодія з чатом (МОДИФІКОВАНО) ---

// Перемикання активної кімнати
function switchRoom(roomId) {
    if (this.roomId === roomId) return; 
    this.roomId = roomId;
    this.messages = []; 
    this.lastSyncToken = '';
    this.roomMembers = []; // Очищуємо учасників
    
    this.fetchMessages(); // Запускаємо завантаження нових повідомлень
    this.fetchRoomMembers(); // ← НОВИЙ ВИКЛИК: Завантажуємо учасників кімнати
}

// Отримання імені кімнати
function getRoomName(roomId) {
    return this.rooms.find(r => r.roomId === roomId)?.name || roomId;
}

// Функції inviteUserToRoom та joinRoom були перенесені у user.js