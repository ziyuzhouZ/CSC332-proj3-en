import { orderAPI } from './api.js';
import { router } from './router.js';

class OrderDetailManager {
    constructor() {
        this.orderId = new URLSearchParams(window.location.search).get('id');
        if (!this.orderId) {
            router.showToast('Order ID cannot be empty', 'error');
            router.navigate('/user/orders');
            return;
        }

        this.elements = {
            container: document.querySelector('.order-detail-container'),
            statusInfo: document.querySelector('.status-info'),
            statusDesc: document.querySelector('.status-desc'),
            statusActions: document.querySelector('.status-actions'),
            logisticsProgress: document.querySelector('.logistics-progress'),
            progressBar: document.querySelector('.progress-bar'),
            progressNodes: document.querySelector('.progress-nodes'),
            logisticsDetail: document.querySelector('.logistics-detail'),
            orderNumber: document.querySelector('.order-number'),
            createTime: document.querySelector('.create-time'),
            paymentMethod: document.querySelector('.payment-method'),
            paymentTime: document.querySelector('.payment-time'),
            receiverName: document.querySelector('.receiver-name'),
            receiverPhone: document.querySelector('.receiver-phone'),
            receiverAddress: document.querySelector('.receiver-address'),
            productList: document.querySelector('.product-list'),
            productsTotal: document.querySelector('.products-total'),
            shippingFee: document.querySelector('.shipping-fee'),
            discountAmount: document.querySelector('.discount-amount'),
            paymentTotal: document.querySelector('.payment-total'),
            cancelModal: document.getElementById('cancelModal'),
            logisticsModal: document.getElementById('logisticsModal'),
            logisticsTimeline: document.querySelector('.logistics-timeline'),
            reviewModal: document.getElementById('reviewModal'),
            appendReviewModal: document.getElementById('appendReviewModal')
        };

        this.logisticsTimer = null;
        this.lastLogisticsUpdate = null;

        this.init();
    }

    /**
     * Initialize
     */
    async init() {
        this.bindEvents();
        await this.loadOrderDetail();
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Cancel order modal events
        const cancelModal = this.elements.cancelModal;
        cancelModal.querySelector('#closeCancelModal').addEventListener('click', () => {
            this.closeCancelModal();
        });
        cancelModal.querySelector('#cancelCancelBtn').addEventListener('click', () => {
            this.closeCancelModal();
        });
        cancelModal.querySelector('#confirmCancelBtn').addEventListener('click', () => {
            this.confirmCancelOrder();
        });
        cancelModal.querySelector('#cancelReason').addEventListener('change', (e) => {
            const otherGroup = cancelModal.querySelector('#otherReasonGroup');
            otherGroup.hidden = e.target.value !== 'other';
        });

        // Logistics detail modal events
        const logisticsModal = this.elements.logisticsModal;
        logisticsModal.querySelector('#closeLogisticsModal').addEventListener('click', () => {
            this.closeLogisticsModal();
        });

        // Review modal events
        const reviewModal = this.elements.reviewModal;
        reviewModal.querySelector('#closeReviewModal').addEventListener('click', () => {
            this.closeReviewModal();
        });
        reviewModal.querySelector('#submitReviews').addEventListener('click', () => {
            this.submitReviews();
        });

        // Append review modal events
        const appendReviewModal = this.elements.appendReviewModal;
        appendReviewModal.querySelector('#closeAppendReviewModal').addEventListener('click', () => {
            this.closeAppendReviewModal();
        });
        appendReviewModal.querySelector('#submitAppendReview').addEventListener('click', () => {
            this.submitAppendReview();
        });
    }

    /**
     * Load order details
     */
    async loadOrderDetail() {
        try {
            const order = await orderAPI.getOrderDetail(this.orderId);
            this.renderOrderDetail(order);
            
            if (['processing', 'shipped'].includes(order.status)) {
                await this.loadLogistics();
            }
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Render order details
     * @param {Object} order - Order data
     */
    renderOrderDetail(order) {
        // Update status information
        this.elements.statusDesc.textContent = this.getStatusDesc(order.status);
        this.updateStatusActions(order);

        // Update order information
        this.elements.orderNumber.textContent = order.orderNumber;
        this.elements.createTime.textContent = new Date(order.createTime).toLocaleString();
        this.elements.paymentMethod.textContent = order.paymentMethod || '-';
        this.elements.paymentTime.textContent = order.paymentTime ? 
            new Date(order.paymentTime).toLocaleString() : '-';

        // Update receiver information
        this.elements.receiverName.textContent = order.receiver.name;
        this.elements.receiverPhone.textContent = order.receiver.phone;
        this.elements.receiverAddress.textContent = 
            `${order.receiver.province} ${order.receiver.city} ${order.receiver.district} ${order.receiver.address}`;

        // Render product list
        this.renderProducts(order.products);

        // Update order summary
        this.elements.productsTotal.textContent = `¥${order.productsTotal.toFixed(2)}`;
        this.elements.shippingFee.textContent = `¥${order.shippingFee.toFixed(2)}`;
        this.elements.discountAmount.textContent = `-¥${order.discountAmount.toFixed(2)}`;
        this.elements.paymentTotal.textContent = `¥${order.paymentTotal.toFixed(2)}`;
    }

    /**
     * Render product list
     * @param {Array} products - Product data
     */
    renderProducts(products) {
        const productList = this.elements.productList;
        productList.innerHTML = '';

        products.forEach(product => {
            const element = document.createElement('div');
            element.className = 'product-item';
            element.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-specs">${product.specs}</p>
                    <div class="product-price">
                        <span class="unit-price">¥${product.price.toFixed(2)}</span>
                        <span class="quantity">x${product.quantity}</span>
                    </div>
                </div>
            `;
            productList.appendChild(element);
        });
    }

    /**
     * Update order status action buttons
     * @param {Object} order - Order data
     */
    updateStatusActions(order) {
        const actions = {
            pending: [
                { text: 'Pay Now', class: 'btn-primary', handler: () => this.payOrder() },
                { text: 'Cancel Order', class: 'btn-secondary', handler: () => this.showCancelModal() }
            ],
            processing: [
                { text: 'View Logistics', class: 'btn-secondary', handler: () => this.showLogisticsModal() }
            ],
            shipped: [
                { text: 'Confirm Receipt', class: 'btn-primary', handler: () => this.confirmReceipt() },
                { text: 'View Logistics', class: 'btn-secondary', handler: () => this.showLogisticsModal() }
            ],
            completed: [
                { text: 'Buy Again', class: 'btn-primary', handler: () => this.rebuyOrder() },
                { text: 'Delete Order', class: 'btn-secondary', handler: () => this.deleteOrder() }
            ],
            cancelled: [
                { text: 'Delete Order', class: 'btn-secondary', handler: () => this.deleteOrder() }
            ]
        };

        const container = this.elements.statusActions;
        container.innerHTML = '';

        const orderActions = actions[order.status] || [];
        orderActions.forEach(action => {
            const button = document.createElement('button');
            button.className = action.class;
            button.textContent = action.text;
            button.addEventListener('click', action.handler);
            container.appendChild(button);
        });
    }

    /**
     * Load logistics information
     */
    async loadLogistics() {
        try {
            const logistics = await orderAPI.getLogistics(this.orderId);
            this.renderLogistics(logistics);
            this.lastLogisticsUpdate = Date.now();
            
            // Start auto-update if order is not delivered
            if (logistics.status !== 'delivered') {
                this.startLogisticsUpdate();
            }
        } catch (error) {
            console.error('Failed to load logistics information:', error);
            this.elements.logisticsProgress.hidden = true;
        }
    }

    /**
     * Render logistics information
     * @param {Object} logistics - Logistics data
     */
    renderLogistics(logistics) {
        this.elements.logisticsProgress.hidden = false;

        // Update progress bar
        const progress = this.calculateProgress(logistics.status);
        this.elements.progressBar.style.width = `${progress}%`;

        // Update nodes
        this.renderProgressNodes(logistics);

        // Update logistics timeline
        this.renderLogisticsTimeline(logistics);
    }

    /**
     * Render progress nodes
     * @param {Object} logistics - Logistics data
     */
    renderProgressNodes(logistics) {
        const nodes = [
            { status: 'pending', text: 'Order Placed' },
            { status: 'processing', text: 'Processing' },
            { status: 'shipped', text: 'Shipped' },
            { status: 'delivered', text: 'Delivered' }
        ];

        const container = this.elements.progressNodes;
        container.innerHTML = '';

        nodes.forEach(node => {
            const element = document.createElement('div');
            element.className = 'progress-node';
            if (logistics.status === node.status) {
                element.classList.add('active');
            }
            element.textContent = node.text;
            container.appendChild(element);
        });
    }

    /**
     * Render logistics timeline
     * @param {Object} logistics - Logistics data
     */
    renderLogisticsTimeline(logistics) {
        const container = this.elements.logisticsTimeline;
        container.innerHTML = '';

        logistics.timeline.forEach(item => {
            const element = document.createElement('div');
            element.className = 'timeline-item';
            element.innerHTML = `
                <div class="timeline-time">${new Date(item.time).toLocaleString()}</div>
                <div class="timeline-content">${item.content}</div>
            `;
            container.appendChild(element);
        });
    }

    /**
     * Calculate progress percentage
     * @param {string} status - Order status
     * @returns {number} Progress percentage
     */
    calculateProgress(status) {
        const progressMap = {
            pending: 25,
            processing: 50,
            shipped: 75,
            delivered: 100
        };
        return progressMap[status] || 0;
    }

    /**
     * Get status description
     * @param {string} status - Order status
     * @returns {string} Status description
     */
    getStatusDesc(status) {
        const statusMap = {
            pending: 'Waiting for payment',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || 'Unknown';
    }

    /**
     * Show cancel order modal
     */
    showCancelModal() {
        this.elements.cancelModal.style.display = 'block';
    }

    /**
     * Close cancel order modal
     */
    closeCancelModal() {
        this.elements.cancelModal.style.display = 'none';
    }

    /**
     * Confirm cancel order
     */
    async confirmCancelOrder() {
        const reason = this.elements.cancelModal.querySelector('#cancelReason').value;
        const otherReason = this.elements.cancelModal.querySelector('#otherReason').value;
        
        try {
            await orderAPI.cancelOrder(this.orderId, {
                reason: reason === 'other' ? otherReason : reason
            });
            
            router.showToast('Order cancelled successfully', 'success');
            this.closeCancelModal();
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Show logistics modal
     */
    showLogisticsModal() {
        this.elements.logisticsModal.style.display = 'block';
    }

    /**
     * Close logistics modal
     */
    closeLogisticsModal() {
        this.elements.logisticsModal.style.display = 'none';
    }

    /**
     * Pay order
     */
    async payOrder() {
        try {
            const paymentUrl = await orderAPI.createPayment(this.orderId);
            window.location.href = paymentUrl;
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Confirm receipt
     */
    async confirmReceipt() {
        try {
            await orderAPI.confirmReceipt(this.orderId);
            router.showToast('Receipt confirmed successfully', 'success');
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Rebuy order
     */
    async rebuyOrder() {
        try {
            await orderAPI.rebuyOrder(this.orderId);
            router.navigate('/cart');
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Delete order
     */
    async deleteOrder() {
        try {
            await orderAPI.deleteOrder(this.orderId);
            router.showToast('Order deleted successfully', 'success');
            router.navigate('/user/orders');
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Start logistics update timer
     */
    startLogisticsUpdate() {
        this.stopLogisticsUpdate();
        this.logisticsTimer = setInterval(() => {
            this.refreshLogistics();
        }, 5 * 60 * 1000); // Update every 5 minutes
    }

    /**
     * Stop logistics update timer
     */
    stopLogisticsUpdate() {
        if (this.logisticsTimer) {
            clearInterval(this.logisticsTimer);
            this.logisticsTimer = null;
        }
    }

    /**
     * Refresh logistics information
     */
    async refreshLogistics() {
        try {
            const logistics = await orderAPI.getLogistics(this.orderId);
            this.renderLogistics(logistics);
            this.lastLogisticsUpdate = Date.now();
            
            if (logistics.status === 'delivered') {
                this.stopLogisticsUpdate();
            }
        } catch (error) {
            console.error('Failed to refresh logistics:', error);
        }
    }

    /**
     * Show review modal
     */
    showReviewModal() {
        this.elements.reviewModal.style.display = 'block';
    }

    /**
     * Close review modal
     */
    closeReviewModal() {
        this.elements.reviewModal.style.display = 'none';
    }

    /**
     * Submit reviews
     */
    async submitReviews() {
        const form = this.elements.reviewModal.querySelector('form');
        const formData = new FormData(form);
        
        try {
            // Upload review images if any
            const imageFiles = formData.getAll('images');
            if (imageFiles.length > 0) {
                const imageUrls = await this.uploadReviewImages(formData);
                formData.set('imageUrls', JSON.stringify(imageUrls));
            }
            
            await orderAPI.submitReviews(this.orderId, formData);
            router.showToast('Review submitted successfully', 'success');
            this.closeReviewModal();
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Upload review images
     * @param {FormData} formData - Form data containing images
     * @returns {Promise<Array>} Array of image URLs
     */
    async uploadReviewImages(formData) {
        try {
            const response = await orderAPI.uploadReviewImages(formData);
            return response.imageUrls;
        } catch (error) {
            console.error('Failed to upload review images:', error);
            throw new Error('Failed to upload review images');
        }
    }

    /**
     * Show append review modal
     * @param {string} reviewId - Review ID
     */
    showAppendReviewModal(reviewId) {
        this.elements.appendReviewModal.dataset.reviewId = reviewId;
        this.elements.appendReviewModal.style.display = 'block';
    }

    /**
     * Close append review modal
     */
    closeAppendReviewModal() {
        this.elements.appendReviewModal.style.display = 'none';
    }

    /**
     * Submit append review
     */
    async submitAppendReview() {
        const form = this.elements.appendReviewModal.querySelector('form');
        const formData = new FormData(form);
        const reviewId = this.elements.appendReviewModal.dataset.reviewId;
        
        try {
            // Upload review images if any
            const imageFiles = formData.getAll('images');
            if (imageFiles.length > 0) {
                const imageUrls = await this.uploadReviewImages(formData);
                formData.set('imageUrls', JSON.stringify(imageUrls));
            }
            
            await orderAPI.submitAppendReview(reviewId, formData);
            router.showToast('Additional review submitted successfully', 'success');
            this.closeAppendReviewModal();
            await this.loadOrderDetail();
        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }
}

// Initialize order detail manager
document.addEventListener('DOMContentLoaded', () => {
    new OrderDetailManager();
}); 