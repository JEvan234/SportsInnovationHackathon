import { rewardsSystem, TIER_LEVELS, POINTS_CONFIG } from '/main.js';
import { InstagramAuthManager } from "/instagramAuth.js";  
import { LeaderboardManager } from "/leaderboard.js";
import { createNavBar } from '/nav.js';

class UIController {
    constructor() {
        // Insert navigation bar
        document.body.insertBefore(createNavBar(), document.body.firstChild);
        
        console.log('UIController initializing...');
        
        // Initialize current user (in real app, this would come from authentication)
        this.initializeQRCode();
        this.currentUser = rewardsSystem.createUser('12345', 'Demo User', 'demo@kennesaw.edu');
        this.initializeEventListeners();
        this.updateUI();
        this.instagramAuth = new InstagramAuthManager();
    }

    initializeQRCode() {
        const referralSection = document.querySelector('.referral-section');
        if (!referralSection) {
            console.error('Referral section not found');
            return;
        }
        
        // Create QR container
        const qrContainer = document.createElement('div');
        qrContainer.id = 'qr-code';
        qrContainer.className = 'qr-code-container';
        
        // Create canvas for QR code
        const canvas = document.createElement('canvas');
        qrContainer.appendChild(canvas);
        
        // Add label under QR code
        const label = document.createElement('span');
        label.className = 'qr-code-label';
        label.textContent = 'Scan for Event Check-in';
        qrContainer.appendChild(label);
        
        referralSection.appendChild(qrContainer);
        this.generateQRCode();
    }

    generateQRCode() {
        // Add debug logs
        console.log('Generating QR code...');
        
        const referralCode = document.querySelector('.referral-code').textContent;
        console.log('Referral code:', referralCode);
        
        const qrData = JSON.stringify({
            referralCode: referralCode,
            timestamp: Date.now()
        });
        console.log('QR data:', qrData);

        try {
            const canvas = document.querySelector('#qr-code canvas');
            QRCode.toCanvas(canvas, qrData, {
                width: 128,
                height: 128,
                margin: 2,
                color: {
                    dark: '#000000',  // Black dots
                    light: '#ffffff'   // White background
                }
            });
            console.log('QR code generated successfully');
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }

    async handleShareReferral() {
        const referralCode = document.querySelector('.referral-code').textContent;
        try {
            await navigator.clipboard.writeText(referralCode);
            alert('Referral code copied to clipboard!');
            this.generateQRCode();
        } catch (err) {
            console.error('Failed to copy referral code:', err);
            alert('Please manually copy the referral code');
        }
    }
    
    initializeEventListeners() {
        // Check-in button listeners
        document.querySelectorAll('.check-in-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handleCheckIn(e));
        });

        // Share referral button listener
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShareReferral());
        }

        // Players modal listeners
        const viewPlayersBtn = document.querySelector('.view-players-btn');
        const modal = document.getElementById('playersModal');
        const closeModal = document.querySelector('.close-modal');

        if (viewPlayersBtn) {
            viewPlayersBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Follow player buttons
        document.querySelectorAll('.follow-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handlePlayerFollow(e));
        });
    }

    updateUI() {
        this.updatePointsDisplay();
        this.updateTierProgress();
        this.updateStreakDisplay();
    }

    updatePointsDisplay() {
        const pointsDisplay = document.querySelector('.points');
        if (pointsDisplay) {
            pointsDisplay.textContent = `${this.currentUser.totalPoints.toLocaleString()} pts`;
        }
    }

    updateTierProgress() {
        const currentTier = this.currentUser.calculateTier();
        const nextTier = this.getNextTier(currentTier);
        
        // Update tier badge
        const tierBadge = document.querySelector('.tier-badge');
        if (tierBadge) {
            tierBadge.textContent = currentTier.name;
            tierBadge.className = `tier-badge ${currentTier.name.split(' ')[0].toLowerCase()}`;
        }

        // Update progress bar
        if (nextTier) {
            const progress = ((this.currentUser.totalPoints - currentTier.minPoints) / 
                            (nextTier.minPoints - currentTier.minPoints)) * 100;
            const progressBar = document.querySelector('.progress-bar');
            const progressText = document.querySelector('.progress-container span');
            
            if (progressBar && progressText) {
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `Progress to ${nextTier.name}: ${Math.round(progress)}%`;
            }
        }

        // Update tier levels
        document.querySelectorAll('.tier-level').forEach(tierElement => {
            tierElement.classList.remove('active');
            if (tierElement.querySelector('h3').textContent === currentTier.name) {
                tierElement.classList.add('active');
            }
        });
    }

    updateStreakDisplay() {
        const streakCount = document.querySelector('.streak-count');
        const multiplier = document.querySelector('.multiplier');
        
        if (streakCount) {
            streakCount.textContent = this.currentUser.currentStreak;
        }
        
        if (multiplier) {
            if (this.currentUser.currentStreak >= POINTS_CONFIG.MIN_STREAK_GAMES) {
                multiplier.textContent = `${POINTS_CONFIG.STREAK_MULTIPLIER}x Points Active!`;
                multiplier.style.display = 'block';
            } else {
                multiplier.style.display = 'none';
            }
        }
    }

    async handleCheckIn(event) {
        const button = event.target;
        const gameCard = button.closest('.game-card');
        
        // Disable button to prevent double check-in
        button.disabled = true;
        button.textContent = 'Checking in...';

        try {
            // Simulate check-in verification (in real app, this would verify location/QR code)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const gameId = 'game_' + Date.now(); // In real app, this would be actual game ID
            const pointsEarned = this.currentUser.attendGame(gameId, new Date());

            // Show success message
            const pointsInfo = gameCard.querySelector('.points-info');
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = `+${pointsEarned} points earned!`;
            pointsInfo.appendChild(successMsg);

            // Update UI
            this.updateUI();

            // Remove success message after 3 seconds
            setTimeout(() => successMsg.remove(), 3000);
        } catch (error) {
            console.error('Check-in failed:', error);
            button.textContent = 'Error - Try Again';
        } finally {
            button.disabled = false;
            button.textContent = 'Checked In';
        }
    }

    async handleShareReferral() {
        const referralCode = document.querySelector('.referral-code').textContent;
        
        try {
            await navigator.clipboard.writeText(referralCode);
            alert('Referral code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy referral code:', err);
            alert('Please manually copy the referral code');
        }
    }

    getNextTier(currentTier) {
        const tiers = Object.values(TIER_LEVELS);
        const currentIndex = tiers.findIndex(tier => tier.name === currentTier.name);
        return tiers[currentIndex + 1];
    }

    async handlePlayerFollow(event) {
        const button = event.target.closest('.follow-btn');
        if (button.classList.contains('followed')) return;

        const playerId = button.dataset.playerId;
        const instagramHandle = button.dataset.instagramHandle;
        
        try {
            // Check if user is authenticated with Instagram
            if (!this.instagramAuth.accessToken) {
                // Redirect to Instagram auth
                window.location.href = this.instagramAuth.getAuthUrl();
                return;
            }

            // Verify the follow
            const isFollowing = await this.instagramAuth.verifyFollow(instagramHandle);
            
            if (isFollowing) {
                const pointsEarned = this.currentUser.followPlayer(playerId);
                
                if (pointsEarned > 0) {
                    // Update button state
                    button.classList.add('followed');
                    button.innerHTML = 'Following ✓';

                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = `+${pointsEarned} points earned!`;
                    button.parentNode.appendChild(successMsg);

                    // Update UI
                    this.updateUI();

                    // Remove success message after 3 seconds
                    setTimeout(() => successMsg.remove(), 3000);
                }
            } else {
                // Show follow prompt
                const followPrompt = document.createElement('div');
                followPrompt.className = 'follow-prompt';
                followPrompt.textContent = 'Please follow the player on Instagram first!';
                button.parentNode.appendChild(followPrompt);
                
                // Open Instagram profile in new tab
                window.open(`https://instagram.com/${instagramHandle}`, '_blank');
                
                // Remove prompt after 3 seconds
                setTimeout(() => followPrompt.remove(), 3000);
            }
        } catch (error) {
            console.error('Failed to verify follow:', error);
            button.textContent = 'Error - Try Again';
        }
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});

// Export the UIController if needed by other modules
export { UIController }; 