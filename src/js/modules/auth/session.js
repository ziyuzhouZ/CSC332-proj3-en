/**
 * Session Management Module
 * Handles user login status and navbar display
 */

// Check if user is logged in
function checkLoginStatus() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    const expiry = localStorage.getItem('session_expiry');
    
    console.log('Checking login status:', !!token, !!userData, !!expiry);
    
    // Check if session is valid
    if (!token || !userData || !expiry || Date.now() > parseInt(expiry)) {
        console.log('Not logged in or session expired');
        return false;
    }
    
    console.log('User is logged in');
    return true;
}

// Get current logged in user information
function getCurrentUser() {
    if (!checkLoginStatus()) {
        return null;
    }
    
    try {
        return JSON.parse(localStorage.getItem('user_data'));
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Update user status in navbar (for all pages)
function updateNavbarUserStatus() {
    const userStatusElem = document.querySelector('.user-status');
    if (!userStatusElem) {
        console.warn('User status container element not found');
        return;
    }
    
    if (checkLoginStatus()) {
        try {
            const userData = getCurrentUser();
            if (userData) {
                userStatusElem.innerHTML = `
                    <div class="user-dropdown">
                        <a href="/html/user-center/index.html" class="user-link">
                            <span>${userData.username || 'User'}</span>
                        </a>
                    </div>
                `;
                console.log('Updated navbar user status to logged in');
            }
        } catch (e) {
            console.error('Error updating user status', e);
        }
    } else {
        userStatusElem.innerHTML = `
            <a href="/html/auth/login.html" class="login-link">Login</a>
            <a href="/html/auth/register.html" class="register-link">Register</a>
        `;
        console.log('Updated navbar user status to logged out');
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('session_expiry');
    console.log('User logged out');
    
    // Redirect to home page
    window.location.href = '/html/index.html';
}

// Auth session management

/**
 * Check admin session status
 * 
 * @returns {Promise} Returns a Promise containing admin information
 */
function checkAdminSession() {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('admin_token');
        
        if (!token) {
            // If on admin page but no token, redirect to login page
            if (window.location.pathname.includes('/admin/') && 
                !window.location.pathname.includes('/admin/login.html') &&
                !window.location.pathname.includes('/admin/register.html')) {
                window.location.href = '/html/admin/login.html';
            }
            reject(new Error('Not logged in'));
            return;
        }
        
        // Verify token validity
        fetch('/api/admin/auth/validate', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                // Handle unauthorized error
                if (response.status === 401 || response.status === 403) {
                    // Clear local storage
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_data');
                    
                    // If on admin page, redirect to login page
                    if (window.location.pathname.includes('/admin/') && 
                        !window.location.pathname.includes('/admin/login.html') &&
                        !window.location.pathname.includes('/admin/register.html')) {
                        window.location.href = '/html/admin/login.html';
                    }
                }
                throw new Error('Invalid session');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.admin) {
                resolve(data.admin);
            } else {
                throw new Error('Verification failed');
            }
        })
        .catch(error => {
            console.error('Session verification error:', error);
            localStorage.removeItem('admin_token');
            reject(error);
        });
    });
}

/**
 * Admin logout
 */
function adminLogout() {
    localStorage.removeItem('admin_token');
    // Additional logout logic can be added here, such as notifying the server
}

/**
 * Admin login
 * 
 * @param {Object} credentials - Object containing username and password
 * @returns {Promise} Returns a Promise with login result
 */
function adminLogin(credentials) {
    return new Promise((resolve, reject) => {
        fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.token) {
                localStorage.setItem('admin_token', data.token);
                resolve(data);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            reject(error);
        });
    });
}

/**
 * Admin registration
 * 
 * @param {Object} userData - Object containing registration data
 * @returns {Promise} Returns a Promise with registration result
 */
function adminRegister(userData) {
    return new Promise((resolve, reject) => {
        fetch('/api/admin/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            reject(error);
        });
    });
}

/**
 * Verify invitation code
 * 
 * @param {string} inviteCode - Invitation code
 * @returns {Promise} Returns a Promise with verification result
 */
function verifyInviteCode(inviteCode) {
    return new Promise((resolve, reject) => {
        fetch('/api/admin/auth/check-invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inviteCode })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Verification failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                throw new Error(data.message || 'Invalid invitation code');
            }
        })
        .catch(error => {
            console.error('Invitation code verification error:', error);
            reject(error);
        });
    });
}

// Export module functions
export {
    checkLoginStatus,
    getCurrentUser,
    updateNavbarUserStatus,
    logout,
    checkAdminSession,
    adminLogout,
    adminLogin,
    adminRegister,
    verifyInviteCode
}; 