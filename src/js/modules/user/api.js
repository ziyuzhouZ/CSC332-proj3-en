import { getSession } from '../auth/api.js';

const API_BASE_URL = 'https://api.fashion-store.com';

/**
 * API request utility
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise} API response
 */
async function fetchAPI(endpoint, options = {}) {
    const session = getSession();
    if (!session) {
        throw new Error('Not logged in');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'X-Device-ID': session.deviceId,
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * User profile related APIs
 */
export const userAPI = {
    /**
     * Get user profile
     * @returns {Promise} User profile
     */
    async getProfile() {
        return fetchAPI('/user/profile');
    },

    /**
     * Update user profile
     * @param {Object} data - User profile data
     * @returns {Promise} Update result
     */
    async updateProfile(data) {
        return fetchAPI('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Upload avatar
     * @param {File} file - Avatar file
     * @returns {Promise} Upload result
     */
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        return fetchAPI('/user/avatar', {
            method: 'POST',
            headers: {
                // Let browser set Content-Type automatically
            },
            body: formData
        });
    }
};

/**
 * Order related APIs
 */
export const orderAPI = {
    /**
     * Get order list
     * @param {Object} params - Query parameters
     * @returns {Promise} Order list
     */
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/user/orders?${queryString}`);
    },

    /**
     * Get order details
     * @param {string} orderId - Order ID
     * @returns {Promise} Order details
     */
    async getOrderDetail(orderId) {
        return fetchAPI(`/user/orders/${orderId}`);
    },

    /**
     * Cancel order
     * @param {string} orderId - Order ID
     * @returns {Promise} Cancel result
     */
    async cancelOrder(orderId) {
        return fetchAPI(`/user/orders/${orderId}/cancel`, {
            method: 'POST'
        });
    },

    /**
     * Confirm receipt
     * @param {string} orderId - Order ID
     * @returns {Promise} Confirmation result
     */
    async confirmReceipt(orderId) {
        return fetchAPI(`/user/orders/${orderId}/confirm`, {
            method: 'POST'
        });
    },

    /**
     * Create payment order
     * @param {string} orderId - Order ID
     * @returns {Promise} Payment order info
     */
    async createPayment(orderId) {
        return fetchAPI(`/user/orders/${orderId}/payment`, {
            method: 'POST'
        });
    },

    /**
     * Check payment status
     * @param {string} orderId - Order ID
     * @returns {Promise} Payment status
     */
    async checkPaymentStatus(orderId) {
        return fetchAPI(`/user/orders/${orderId}/payment/status`);
    },

    /**
     * Cancel payment
     * @param {string} orderId - Order ID
     * @returns {Promise} Cancel result
     */
    async cancelPayment(orderId) {
        return fetchAPI(`/user/orders/${orderId}/payment/cancel`, {
            method: 'POST'
        });
    },

    /**
     * Export order list
     * @param {Object} params - Export parameters
     * @returns {Promise} Export result
     */
    async exportOrders(params) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/user/orders/export?${queryString}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.ms-excel'
            }
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Order_List_${new Date().toLocaleDateString()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Export order details
     * @param {string} orderId - Order ID
     * @returns {Promise} Export result
     */
    async exportOrderDetail(orderId) {
        const response = await fetch(`/user/orders/${orderId}/export`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.ms-excel'
            }
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Order_Details_${orderId}_${new Date().toLocaleDateString()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Submit order reviews
     * @param {string} orderId - Order ID
     * @param {Array} reviews - Review data array
     * @returns {Promise} Submission result
     */
    async submitReviews(orderId, reviews) {
        return fetchAPI(`/user/orders/${orderId}/reviews`, {
            method: 'POST',
            body: JSON.stringify({ reviews })
        });
    },

    /**
     * Get order reviews
     * @param {string} orderId - Order ID
     * @returns {Promise} Review data
     */
    async getReviews(orderId) {
        return fetchAPI(`/user/orders/${orderId}/reviews`);
    },

    /**
     * Append review
     * @param {string} orderId - Order ID
     * @param {string} reviewId - Review ID
     * @param {Object} data - Additional review data
     * @returns {Promise} Submission result
     */
    async appendReview(orderId, reviewId, data) {
        return fetchAPI(`/user/orders/${orderId}/reviews/${reviewId}/append`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

/**
 * Address related APIs
 */
export const addressAPI = {
    /**
     * Get addresses
     * @returns {Promise} Address list
     */
    async getAddresses() {
        return fetchAPI('/user/addresses');
    },

    /**
     * Add address
     * @param {Object} address - Address data
     * @returns {Promise} Add result
     */
    async addAddress(address) {
        return fetchAPI('/user/addresses', {
            method: 'POST',
            body: JSON.stringify(address)
        });
    },

    /**
     * Update address
     * @param {string} id - Address ID
     * @param {Object} address - Address data
     * @returns {Promise} Update result
     */
    async updateAddress(id, address) {
        return fetchAPI(`/user/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(address)
        });
    },

    /**
     * Delete address
     * @param {string} id - Address ID
     * @returns {Promise} Delete result
     */
    async deleteAddress(id) {
        return fetchAPI(`/user/addresses/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Set default address
     * @param {string} id - Address ID
     * @returns {Promise} Set result
     */
    async setDefaultAddress(id) {
        return fetchAPI(`/user/addresses/${id}/default`, {
            method: 'POST'
        });
    }
};

/**
 * Security related APIs
 */
export const securityAPI = {
    /**
     * Change password
     * @param {Object} data - Password change data
     * @returns {Promise} Change result
     */
    async changePassword(data) {
        return fetchAPI('/user/security/password', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Bind phone number
     * @param {Object} data - Phone binding data
     * @returns {Promise} Binding result
     */
    async bindPhone(data) {
        return fetchAPI('/user/security/phone', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Get security logs
     * @returns {Promise} Security logs
     */
    async getSecurityLogs() {
        return fetchAPI('/user/security/logs');
    }
};

/**
 * Notification related APIs
 */
export const notificationAPI = {
    /**
     * Get notifications
     * @param {Object} params - Query parameters
     * @returns {Promise} Notification list
     */
    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return fetchAPI(`/user/notifications?${queryString}`);
    },

    /**
     * Mark as read
     * @param {string} id - Notification ID
     * @returns {Promise} Mark result
     */
    async markAsRead(id) {
        return fetchAPI(`/user/notifications/${id}/read`, {
            method: 'POST'
        });
    },

    /**
     * Delete notification
     * @param {string} id - Notification ID
     * @returns {Promise} Delete result
     */
    async deleteNotification(id) {
        return fetchAPI(`/user/notifications/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get unread count
     * @returns {Promise} Unread count
     */
    async getUnreadCount() {
        return fetchAPI('/user/notifications/unread/count');
    }
};
