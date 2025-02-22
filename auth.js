class AuthManager {
    constructor() {
        this.db = new DatabaseManager();
        this.isLoading = false;
        this.initializeListeners();
    }

    initializeListeners() {
        const form = document.getElementById('signupForm');
        const verifyBtn = document.getElementById('verifyInstagram');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifyInstagram());
        }

        // Add error boundary
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred. Please refresh the page.');
            this.isLoading = false;
            this.updateLoadingState(false);
        });
    }

    updateLoadingState(loading) {
        this.isLoading = loading;
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = loading;
            if (loading) {
                button.dataset.originalText = button.textContent;
                button.textContent = 'Loading...';
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        });
    }

    async handleSignup(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        try {
            this.updateLoadingState(true);
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const instagramHandle = document.getElementById('instagramHandle')?.value;

            if (!email || !password || !instagramHandle) {
                throw new Error('Please fill in all required fields');
            }

            // Validate email domain
            if (!email.endsWith('@kennesaw.edu')) {
                throw new Error('Please use your Kennesaw State University email');
            }

            // Create user record
            const userData = {
                email,
                instagramHandle,
                dateJoined: new Date(),
                points: 800, // New user bonus
                tier: 'White Fan',
                verified: true
            };

            // Store in database
            await this.db.createUser(userData);

            // Create session
            await this.createUserSession(userData);

            // Redirect to dashboard
            window.location.href = '/rewards.html';

        } catch (error) {
            console.error('Signup error:', error);
            this.showError(error.message);
        } finally {
            this.updateLoadingState(false);
        }
    }

    async verifyInstagram() {
        const instagramHandle = document.getElementById('instagramHandle').value;
        const statusElement = document.getElementById('verificationStatus');
        const submitBtn = document.querySelector('.submit-btn');

        try {
            statusElement.textContent = 'Verifying...';
            statusElement.className = 'status-pending';

            // Store Instagram handle for later validation
            await this.db.storeInstagramHandle(instagramHandle);

            // Enable submit button after verification
            submitBtn.disabled = false;
            statusElement.textContent = '✓ Instagram Connected';
            statusElement.className = 'status-success';

        } catch (error) {
            statusElement.textContent = 'Verification failed. Please try again.';
            statusElement.className = 'status-error';
            submitBtn.disabled = true;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const form = document.querySelector('.auth-form');
        if (form) {
            form.prepend(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }
}

// Database Manager (Example using Firebase, but can be adapted for any database)
class DatabaseManager {
    constructor() {
        // Initialize your database connection here
    }

    async createUser(userData) {
        // Implementation of user creation in database
        try {
            // Example using Firebase
            const userRef = await firebase.firestore().collection('users').add(userData);
            return userRef.id;
        } catch (error) {
            throw new Error('Failed to create user account');
        }
    }

    async storeInstagramHandle(handle) {
        // Store Instagram handle for later validation
        try {
            // Example storage implementation
            await firebase.firestore().collection('instagram_handles').add({
                handle,
                dateAdded: new Date()
            });
        } catch (error) {
            throw new Error('Failed to store Instagram handle');
        }
    }
}

// Initialize auth manager only if we're on the auth page
if (document.querySelector('.auth-container')) {
    new AuthManager();
} 