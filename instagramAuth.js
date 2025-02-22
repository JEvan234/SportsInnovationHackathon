const INSTAGRAM_APP_ID = '1234567890';   
const INSTAGRAM_APP_SECRET = '1234567890';
const REDIRECT_URI = 'https://yourwebsite.com/auth/instagram/callback';

export class InstagramAuthManager {
    constructor() {
        this.accessToken = null;
        this.userId = null;
        this.initializeAuth();
    }

    initializeAuth() {
        // Check if we have stored credentials
        const storedToken = localStorage.getItem('instagram_access_token');
        if (storedToken) {
            this.accessToken = storedToken;
            this.userId = localStorage.getItem('instagram_user_id');
        }
    }

    getAuthUrl() {
        const scope = 'user_profile,user_follows';
        return `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}&response_type=code`;
    }

    async handleAuthCallback(code) {
        try {
            // Exchange code for access token
            const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: INSTAGRAM_APP_ID,
                    client_secret: INSTAGRAM_APP_SECRET,
                    grant_type: 'authorization_code',
                    redirect_uri: REDIRECT_URI,
                    code: code
                })
            });

            const tokenData = await tokenResponse.json();
            
            if (tokenData.access_token) {
                this.accessToken = tokenData.access_token;
                this.userId = tokenData.user_id;
                
                // Store credentials
                localStorage.setItem('instagram_access_token', this.accessToken);
                localStorage.setItem('instagram_user_id', this.userId);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Instagram authentication failed:', error);
            return false;
        }
    }

    async verifyFollow(targetUsername) {
        if (!this.accessToken) {
            throw new Error('User not authenticated with Instagram');
        }

        try {
            // First, get the target user's Instagram ID
            const targetUserResponse = await fetch(
                `https://graph.instagram.com/v12.0/${targetUsername}?fields=id&access_token=${this.accessToken}`
            );
            const targetUserData = await targetUserResponse.json();
            
            if (!targetUserData.id) {
                throw new Error('Could not find target user');
            }

            // Check if the authenticated user follows the target user
            const followCheckResponse = await fetch(
                `https://graph.instagram.com/v12.0/${this.userId}/follows?access_token=${this.accessToken}`
            );
            const followData = await followCheckResponse.json();

            // Check if target user is in the follows list
            return followData.data.some(follow => follow.id === targetUserData.id);
        } catch (error) {
            console.error('Follow verification failed:', error);
            throw error;
        }
    }
} 