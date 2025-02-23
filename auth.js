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

// User data storage (in real app, this would be a database)
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

const authForm = document.getElementById('authForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

function showError(message) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = message;
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.style.display = 'block';
    successMessage.textContent = message;
    errorMessage.style.display = 'none';
}

function validateReferralCode(code) {
    // Check if the referral code exists in any user's data
    return Object.values(users).some(user => user.referralCode === code);
}

function generateReferralCode(username) {
    return `KSU-${username}-${Date.now().toString(36)}`;
}

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const referralCode = document.getElementById('referralCode').value.trim();

    // Check if it's a new user
    if (!users[username]) {
        // Create new user
        users[username] = {
            username: username,
            points: 0,
            referralCode: generateReferralCode(username),
            beenReferred: false,
            referralsSent: 0
        };

        // Handle referral code if provided
        if (referralCode) {
            if (validateReferralCode(referralCode)) {
                // Find referrer
                const referrer = Object.values(users).find(user => user.referralCode === referralCode);
                if (referrer) {
                    users[username].points += 50;
                    users[username].beenReferred = true;
                    users[referrer.username].points += 100;
                    users[referrer.username].referralsSent += 1;
                    showSuccess('Referral bonus applied! You got 50 points!');
                }
            } else {
                showError('Invalid referral code');
                return;
            }
        }
    }

    // Set current user and save data
    currentUser = users[username];
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Redirect to profile page
    window.location.href = 'profile.html';
}); 