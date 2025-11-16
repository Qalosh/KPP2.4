async function login() {
    if (!this.username || !this.password) return;

    try {
        const res = await fetch('https://matrix.org/_matrix/client/r0/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'm.login.password',
                user: this.username,
                password: this.password
            })
        });

        const data = await res.json();

        if (data.access_token) {
            this.accessToken = data.access_token;
            this.userId = data.user_id;

            // Зберігання токенів локально
            localStorage.setItem('accessToken', this.accessToken);
            localStorage.setItem('userId', this.userId);
            
            this.error = '';
            this.password = '';
            
            // Після успішного логіну завантажуємо кімнати та запускаємо синхронізацію
            await this.fetchRoomsWithNames(); 
            this.fetchMessages(); 
        } else {
            this.error = data.error || 'Login failed';
        }
    } catch (e) {
        this.error = 'Network error: ' + e.message;
    }
}