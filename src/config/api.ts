const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
    async getStats(){
        try {
            const response = await fetch(`${API_URL}/api/stats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    },
    
    async saveEmail(address: string, email: string) {
        try {
            const response = await fetch(`${API_URL}/api/users/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address, email }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('Error saving email:', error);
            throw error;
        }
    },
};