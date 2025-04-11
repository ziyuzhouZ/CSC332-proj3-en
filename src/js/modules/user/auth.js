// Import auth API module
import { getSession, logout } from '../auth/api.js';

// Check login status
function checkAuth() {
    const session = getSession();
    if (!session) {
        // Not logged in, redirect to login page
        window.location.href = '../auth/login.html';
        return false;
    }
    
    // Logged in, update user info display
    updateUserInfo(session.user);
    return true;
}

// Update user info display
function updateUserInfo(user) {
    // Update username
    const usernameElement = document.querySelector('.username');
    if (usernameElement) {
        usernameElement.textContent = user.username || 'User';
    }
    
    // Update user avatar
    const avatarElement = document.querySelector('.user-avatar');
    if (avatarElement && user.avatar) {
        avatarElement.src = user.avatar;
    }
    
    // Update navigation bar user status
    const userStatusElement = document.querySelector('.user-status');
    if (userStatusElement) {
        userStatusElement.innerHTML = `
            <div class="user-dropdown">
                <a class="user-link">
                    <span>${user.username}</span>
                </a>
            </div>
        `;
    }
    
    // Log login info to console
    console.log('User logged in:', user);
}

// Initialize logout functionality
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Confirm logout
                if (confirm('Are you sure you want to logout?')) {
                    await logout();
                    // Redirect to home page after successful logout
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.error('Logout failed:', error);
                alert('Logout failed, please try again');
            }
        });
        console.log('Logout button initialized');
    } else {
        console.error('Logout button not found');
    }
}

// Execute on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('User center page loaded, checking authentication status');
    if (checkAuth()) {
        console.log('User authenticated, initializing logout functionality');
        initLogout();
    } else {
        console.log('User not authenticated, redirecting to login page');
    }
});

export { checkAuth, updateUserInfo }; 