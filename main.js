// User Tier Configuration
const TIER_LEVELS = {
    WHITE: { name: 'White Fan', minPoints: 0, multiplier: 1 },
    GREY: { name: 'Grey Fan', minPoints: 1000, multiplier: 1.1 },
    BLACK: { name: 'Black Fan', minPoints: 2500, multiplier: 1.2 },
    GOLD: { name: 'Gold Fan', minPoints: 5000, multiplier: 1.3 }
};

// Point System Configuration
const POINTS_CONFIG = {
    FIRST_GAME_BONUS: 500,
    BASE_GAME_ATTENDANCE: 250,
    REFERRAL_BONUS: 800,
    PLAYER_FOLLOW_POINTS: 50,
    MIN_STREAK_GAMES: 5,
    STREAK_MULTIPLIERS: {
        5: 1.5,
        10: 2,
        15: 2.5,
        20: 3,
        25: 3.5,
        30: 4
    }
};

class User {
    constructor(studentId, name, email) {
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.totalPoints = 0;
        this.currentStreak = 0;
        this.gamesAttended = [];
        this.referrals = [];
        this.followedPlayers = new Set();
        this.isFirstGame = true;
    }

    calculateTier() {
        if (this.totalPoints >= TIER_LEVELS.GOLD.minPoints) return TIER_LEVELS.GOLD;
        if (this.totalPoints >= TIER_LEVELS.BLACK.minPoints) return TIER_LEVELS.BLACK;
        if (this.totalPoints >= TIER_LEVELS.GREY.minPoints) return TIER_LEVELS.GREY;
        return TIER_LEVELS.WHITE;
    }

    calculateStreakMultiplier() {
        if (this.currentStreak < POINTS_CONFIG.MIN_STREAK_GAMES) {
            return 1;
        }
        
        const streakLevels = Object.keys(POINTS_CONFIG.STREAK_MULTIPLIERS)
            .map(Number)
            .sort((a, b) => b - a);
        
        for (const level of streakLevels) {
            if (this.currentStreak >= level) {
                return POINTS_CONFIG.STREAK_MULTIPLIERS[level];
            }
        }
        return 1;
    }

    attendGame(gameId, date) {
        let pointsEarned = POINTS_CONFIG.BASE_GAME_ATTENDANCE;
        
        // First game bonus
        if (this.isFirstGame) {
            pointsEarned += POINTS_CONFIG.FIRST_GAME_BONUS;
            this.isFirstGame = false;
        }

        // Apply streak multiplier
        const streakMultiplier = this.calculateStreakMultiplier();
        pointsEarned *= streakMultiplier;

        // Apply tier multiplier
        pointsEarned *= this.calculateTier().multiplier;

        // Round to nearest integer
        pointsEarned = Math.round(pointsEarned);

        this.totalPoints += pointsEarned;
        this.gamesAttended.push({ gameId, date, pointsEarned });
        this.updateStreak(date);

        return pointsEarned;
    }

    addReferral(referredUserId) {
        this.referrals.push(referredUserId);
        this.totalPoints += POINTS_CONFIG.REFERRAL_BONUS;
        return POINTS_CONFIG.REFERRAL_BONUS;
    }

    followPlayer(playerId) {
        if (!this.followedPlayers.has(playerId)) {
            this.followedPlayers.add(playerId);
            this.totalPoints += POINTS_CONFIG.PLAYER_FOLLOW_POINTS;
            return POINTS_CONFIG.PLAYER_FOLLOW_POINTS;
        }
        return 0;
    }

    updateStreak(currentGameDate) {
        const lastGame = this.gamesAttended[this.gamesAttended.length - 2];
        if (!lastGame) {
            this.currentStreak = 1;
            return;
        }

        const daysSinceLastGame = (new Date(currentGameDate) - new Date(lastGame.date)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastGame <= 10) {
            this.currentStreak++;
        } else {
            this.currentStreak = 1;
        }
    }
}

// Example usage
const rewardsSystem = {
    users: new Map(),

    createUser(studentId, name, email) {
        const user = new User(studentId, name, email);
        this.users.set(studentId, user);
        return user;
    },

    getUser(studentId) {
        return this.users.get(studentId);
    }
};

export { rewardsSystem, User, TIER_LEVELS, POINTS_CONFIG };

document.addEventListener('DOMContentLoaded', () => {
    // Existing referral submission code
    const referralInput = document.getElementById('referralInput');
    const submitButton = document.getElementById('submitReferral');
    const successMessage = document.getElementById('successMessage');

    submitButton.addEventListener('click', () => {
        const code = referralInput.value.trim();
        if (code) {
            localStorage.setItem('referralCode', code);
            successMessage.style.display = 'block';
            referralInput.value = '';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
    });

    // New copy-to-clipboard functionality
    const copyButton = document.getElementById('copyButton');
    const referralCode = document.getElementById('myReferralCode');

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(referralCode.textContent);
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });
});

// Store generated key
let currentKey = '';

// Generate random key on page load
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let key = '';
    for (let i = 0; i < 6; i++) {
        if (i === 3) key += '-';
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentKey = key;
    document.getElementById('generatedKey').textContent = key;
}

// Copy key to clipboard
function copyKey() {
    navigator.clipboard.writeText(currentKey);
    const copyBtn = document.querySelector('.copy-btn');
    copyBtn.textContent = 'Key Copied!';
    setTimeout(() => {
        copyBtn.textContent = 'Copy Key';
    }, 2000);
}

// Initialize points
let currentPoints = 0;

// Function to update points
function updatePoints(newPoints) {
    currentPoints += newPoints;
    document.getElementById('pointsValue').textContent = currentPoints;
    
    // Optional: Add animation effect
    const pointsElement = document.getElementById('pointsValue');
    pointsElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        pointsElement.style.transform = 'scale(1)';
    }, 200);
}

// Modify your existing verifyKey function
function verifyKey() {
    const input = document.getElementById('keyInput');
    const message = document.getElementById('verificationMessage');
    
    if (input.value.toUpperCase() === currentKey) {
        message.textContent = 'Success! Key verified!';
        message.className = 'verification-message success';
        updatePoints(100); // Add 100 points for successful verification
        input.value = '';
    } else {
        message.textContent = 'Invalid key. Please try again.';
        message.className = 'verification-message error';
    }
}

// Optional: Save points to localStorage to persist between page refreshes
function savePoints() {
    localStorage.setItem('userPoints', currentPoints);
}

function loadPoints() {
    const savedPoints = localStorage.getItem('userPoints');
    if (savedPoints) {
        currentPoints = parseInt(savedPoints);
        document.getElementById('pointsValue').textContent = currentPoints;
    }
}

// Load points when page loads
window.onload = function() {
    generateKey();
    loadPoints();
};

// Save points when page unloads
window.onbeforeunload = savePoints;

function handleTicket(ticketData) {
    try {
        // If ticketData is already a string, no need to parse it
        const ticket = typeof ticketData === 'string' ? JSON.parse(ticketData) : ticketData;
        
        // Check if ticket has ticketId
        if (ticket && ticket.ticketId) {
            // Use the correct validation URL with the ticketId
            const validationUrl = `http://127.0.0.1:5500/validate.html?ticket=${encodeURIComponent(ticket.ticketId)}`;
            
            // Redirect to validation page
            window.location.href = validationUrl;
        } else {
            console.error('Invalid ticket data');
            alert('Invalid QR code format');
        }
    } catch (error) {
        console.error('Error processing ticket:', error);
        alert('Error processing QR code');
    }
}
