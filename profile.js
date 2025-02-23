document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // If no user is signed in, redirect to signin page
        window.location.href = 'signin.html';
        return;
    }

    // Update profile information
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('pointsValue').textContent = currentUser.points;
    document.getElementById('referralsSentValue').textContent = currentUser.referralsSent;
    document.getElementById('referralCodeValue').textContent = currentUser.referralCode;
}); 