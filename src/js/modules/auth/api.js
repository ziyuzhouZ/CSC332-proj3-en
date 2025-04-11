/**
 * API Base URL
 */
const API_BASE_URL = '/api';

/**
 * Session Management
 */
const SESSION = {
    TOKEN_KEY: 'auth_token',
    USER_DATA_KEY: 'user_data',
    EXPIRY_KEY: 'session_expiry',
    EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Get session information
 * @returns {Object|null} Session information
 */
function getSession() {
    const token = localStorage.getItem(SESSION.TOKEN_KEY);
    const userData = localStorage.getItem(SESSION.USER_DATA_KEY);
    const expiry = localStorage.getItem(SESSION.EXPIRY_KEY);

    if (!token || !userData || !expiry) {
        return null;
    }

    if (Date.now() > parseInt(expiry)) {
        clearSession();
        return null;
    }

    return { 
        token, 
        user: JSON.parse(userData)
    };
}

/**
 * Check if user is admin
 * @returns {Boolean} Whether user is admin
 */
function isAdmin() {
    const session = getSession();
    if (!session || !session.user) {
        return false;
    }
    
    return session.user.role === 'admin';
}

/**
 * Set session information
 * @param {string} token - JWT token
 * @param {Object} userData - User data
 */
function setSession(token, userData) {
    localStorage.setItem(SESSION.TOKEN_KEY, token);
    localStorage.setItem(SESSION.USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION.EXPIRY_KEY, Date.now() + SESSION.EXPIRY_TIME);
}

/**
 * Clear session information
 */
function clearSession() {
    localStorage.removeItem(SESSION.TOKEN_KEY);
    localStorage.removeItem(SESSION.USER_DATA_KEY);
    localStorage.removeItem(SESSION.EXPIRY_KEY);
}

/**
 * Safely parse JSON response
 * @param {Response} response - fetch response object 
 * @returns {Promise<Object>} Parsed JSON object
 */
async function safeParseJSON(response) {
    try {
        // First check response status
        if (!response.ok) {
            throw new Error(`Server returned error: ${response.status}`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not in JSON format');
        }
        
        // Get response text
        const text = await response.text();
        
        // Ensure text is not empty
        if (!text.trim()) {
            throw new Error('Response content is empty');
        }
        
        // Try to parse JSON
        return JSON.parse(text);
    } catch (error) {
        console.error('JSON parsing error:', error);
        throw error;
    }
}

/**
 * API request utility
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise} API response
 */
async function fetchAPI(endpoint, options = {}) {
    const session = getSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(session && { 'Authorization': `Bearer ${session.token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        return await safeParseJSON(response);
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Login
 * @param {Object} credentials - Login credentials
 * @returns {Promise} Login response
 */
async function login(credentials) {
    const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });

    if (data.token) {
        setSession(data.token, data.user);
    }

    return data;
}

/**
 * Register
 * @param {Object} userData - User data
 * @returns {Promise} Registration response
 */
async function register(userData) {
    return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

/**
 * Check username
 * @param {string} username - Username
 * @returns {Promise} Check response
 */
async function checkUsername(username) {
    return fetchAPI(`/auth/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET' // Explicitly specify GET method
    });
}

/**
 * Logout
 * @returns {Promise<Object>} Logout response
 */
async function logout() {
    // Clear session information
    clearSession();
    
    // Return success status instead of auto-redirect
    return { success: true };
}

/**
 * Initialize session monitoring
 */
function initSessionMonitor() {
    // Check login status
    const session = getSession();
    
    // Add special logic for login page
    if (window.location.pathname.includes('/auth/login.html') && session) {
        if (isAdmin() && window.location.search.includes('redirect=admin')) {
            window.location.href = '/html/admin/dashboard.html';
        } else {
            window.location.href = '/html/index.html';
        }
        return;
    }
    
    // Add special protection for admin pages
    if (window.location.pathname.includes('/admin/') && (!session || !isAdmin())) {
        window.location.href = '/html/auth/login.html?redirect=admin';
        return;
    }
    
    // Add protection for pages requiring login
    if (!session && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/html/auth/login.html';
        return;
    }
}

/**
 * Get store list
 * @returns {Promise} API response
 */
async function getStores() {
    return fetchAPI('/admin/stores', {
        method: 'GET'
    });
}

/**
 * Get store details
 * @param {number} storeId - Store ID
 * @param {string} dateFilter - Date filter condition (today/week/month/custom)
 * @param {string} startDate - Custom start date (optional)
 * @param {string} endDate - Custom end date (optional)
 * @returns {Promise} API response
 */
async function getStoreDetails(storeId, dateFilter, startDate, endDate) {
    let url = `/admin/stores/${storeId}?dateFilter=${dateFilter}`;
    
    if (dateFilter === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    
    return fetchAPI(url, {
        method: 'GET'
    });
}

/**
 * Get sales summary
 * @param {string} period - Time period (day/week/month)
 * @returns {Promise} API response
 */
async function getSalesSummary(period = 'day') {
    return fetchAPI(`/admin/sales/summary?period=${period}`, {
        method: 'GET'
    });
}

/**
 * Get product inventory
 * @param {number} storeId - Store ID (optional, 0 for all stores)
 * @returns {Promise} API response
 */
async function getInventory(storeId = 0) {
    return fetchAPI(`/admin/inventory?storeId=${storeId}`, {
        method: 'GET'
    });
}

/**
 * Update product inventory
 * @param {number} productId - Product ID
 * @param {number} storeId - Store ID
 * @param {number} quantity - New quantity
 * @returns {Promise} API response
 */
async function updateInventory(productId, storeId, quantity) {
    return fetchAPI('/admin/inventory/update', {
        method: 'POST',
        body: JSON.stringify({ productId, storeId, quantity })
    });
}

/**
 * Get user profile
 * @returns {Promise} API response
 */
async function getUserProfile() {
    return fetchAPI('/user/profile', {
        method: 'GET'
    });
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data
 * @returns {Promise} API response
 */
async function updateUserProfile(profileData) {
    return fetchAPI('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
}

// Export functions
export {
    login,
    register,
    logout,
    checkUsername,
    getSession,
    clearSession,
    isAdmin,
    safeParseJSON,
    getStores,
    getStoreDetails,
    getSalesSummary,
    getInventory,
    updateInventory,
    getUserProfile,
    updateUserProfile
}; 