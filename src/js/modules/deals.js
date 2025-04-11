/**
 * Marketing Features Management Class
 */
class DealsManager {
    constructor() {
        this.state = {
            countdown: {
                endTime: new Date('2024-12-31 23:59:59').getTime(),
                timer: null
            },
            coupons: new Set(this.loadCoupons()),
            points: parseInt(localStorage.getItem('userPoints')) || 0
        };

        this.elements = {
            countdownTimer: document.querySelector('.countdown-timer'),
            couponsGrid: document.querySelector('.coupons-grid'),
            dealsGrid: document.querySelector('.deals-grid'),
            pointsGrid: document.querySelector('.points-grid'),
            pointsModal: document.getElementById('pointsModal'),
            toastSuccess: document.querySelector('.toast-success')
        };

        this.templates = {
            dealProduct: document.getElementById('dealProductTemplate'),
            pointsProduct: document.getElementById('pointsProductTemplate')
        };

        this.init();
    }

    /**
     * Initialize
     */
    async init() {
        this.startCountdown();
        this.bindEvents();
        await this.loadDeals();
        await this.loadPointsProducts();
        this.updatePointsDisplay();
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Coupon collection
        this.elements.couponsGrid?.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-get-coupon');
            if (button) {
                const couponCard = button.closest('.coupon-card');
                this.getCoupon(couponCard.dataset.id);
            }
        });

        // Special offer product purchase
        this.elements.dealsGrid?.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-buy');
            if (button) {
                const productCard = button.closest('.product-card');
                this.buyProduct(productCard.dataset.id);
            }
        });

        // Points redemption
        this.elements.pointsGrid?.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-exchange');
            if (button) {
                const pointsCard = button.closest('.points-card');
                this.exchangeProduct(pointsCard.dataset.id);
            }
        });

        // Close insufficient points prompt
        this.elements.pointsModal?.querySelector('.btn-close').addEventListener('click', () => {
            this.elements.pointsModal.classList.remove('visible');
        });

        // Go shopping button
        this.elements.pointsModal?.querySelector('.btn-primary').addEventListener('click', () => {
            this.elements.pointsModal.classList.remove('visible');
            router.navigate('/shop');
        });
    }

    /**
     * Start countdown
     */
    startCountdown() {
        if (!this.elements.countdownTimer) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = this.state.countdown.endTime - now;

            if (distance < 0) {
                clearInterval(this.state.countdown.timer);
                this.elements.countdownTimer.innerHTML = 'Event has ended';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.elements.countdownTimer.querySelector('.days').textContent = 
                days.toString().padStart(2, '0');
            this.elements.countdownTimer.querySelector('.hours').textContent = 
                hours.toString().padStart(2, '0');
            this.elements.countdownTimer.querySelector('.minutes').textContent = 
                minutes.toString().padStart(2, '0');
            this.elements.countdownTimer.querySelector('.seconds').textContent = 
                seconds.toString().padStart(2, '0');
        };

        updateCountdown();
        this.state.countdown.timer = setInterval(updateCountdown, 1000);
    }

    /**
     * Load special offer products
     */
    async loadDeals() {
        if (!this.elements.dealsGrid) return;

        try {
            const deals = await this.fetchDeals();
            this.renderDeals(deals);
        } catch (error) {
            console.error('Failed to load special offer products:', error);
        }
    }

    /**
     * Render special offer products
     * @param {Array} deals - Special offer product data
     */
    renderDeals(deals) {
        this.elements.dealsGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        deals.forEach(deal => {
            const element = this.templates.dealProduct.content.cloneNode(true);
            const card = element.querySelector('.product-card');

            card.dataset.id = deal.id;
            
            const img = card.querySelector('img');
            img.src = deal.image;
            img.alt = deal.name;

            card.querySelector('.product-name').textContent = deal.name;
            card.querySelector('.current-price').textContent = `¥${deal.price}`;
            card.querySelector('.original-price').textContent = `¥${deal.originalPrice}`;
            card.querySelector('.discount-amount').textContent = deal.discount;
            card.querySelector('.points-amount').textContent = Math.floor(deal.price * 0.01);

            if (deal.memberOnly) {
                card.querySelector('.member-price').style.display = 'block';
            }

            fragment.appendChild(card);
        });

        this.elements.dealsGrid.appendChild(fragment);
    }

    /**
     * Load points products
     */
    async loadPointsProducts() {
        if (!this.elements.pointsGrid) return;

        try {
            const products = await this.fetchPointsProducts();
            this.renderPointsProducts(products);
        } catch (error) {
            console.error('Failed to load points products:', error);
        }
    }

    /**
     * Render points products
     * @param {Array} products - Points product data
     */
    renderPointsProducts(products) {
        this.elements.pointsGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        products.forEach(product => {
            const element = this.templates.pointsProduct.content.cloneNode(true);
            const card = element.querySelector('.points-card');

            card.dataset.id = product.id;
            
            const img = card.querySelector('img');
            img.src = product.image;
            img.alt = product.name;

            card.querySelector('.product-name').textContent = product.name;
            card.querySelector('.points-amount').textContent = product.points;
            
            const progress = (product.stock / product.totalStock) * 100;
            card.querySelector('.progress').style.width = `${progress}%`;
            card.querySelector('.stock-amount').textContent = product.stock;

            const button = card.querySelector('.btn-exchange');
            if (product.stock === 0) {
                button.disabled = true;
                button.textContent = 'Sold Out';
            }

            fragment.appendChild(card);
        });

        this.elements.pointsGrid.appendChild(fragment);
    }

    /**
     * Get coupon
     * @param {string} couponId - Coupon ID
     */
    async getCoupon(couponId) {
        try {
            const coupon = await this.getCouponAPI(couponId);
            
            if (coupon.memberOnly && !this.checkMemberStatus()) {
                router.showToast('Members only', 'error');
                return;
            }

            if (this.state.coupons.has(couponId)) {
                router.showToast('You have already claimed this coupon', 'error');
                return;
            }

            this.state.coupons.add(couponId);
            this.saveCoupons();
            this.showToast('Coupon claimed successfully');

        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Buy special offer product
     * @param {string} productId - Product ID
     */
    async buyProduct(productId) {
        try {
            const product = await this.getProductAPI(productId);
            
            if (product.memberOnly && !this.checkMemberStatus()) {
                router.showToast('Members only', 'error');
                return;
            }

            await this.addToCartAPI(productId);
            this.showToast('Added to cart successfully');
            router.navigate('/cart');

        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Exchange points product
     * @param {string} productId - Product ID
     */
    async exchangeProduct(productId) {
        try {
            const product = await this.getPointsProductAPI(productId);
            
            if (product.points > this.state.points) {
                this.showPointsGapModal(product.points - this.state.points);
                return;
            }

            await this.exchangeAPI(productId);
            this.state.points -= product.points;
            this.updatePointsDisplay();
            this.showToast('Points redemption successful');

        } catch (error) {
            router.showToast(error.message, 'error');
        }
    }

    /**
     * Show points gap modal
     * @param {number} gap - Points gap
     */
    showPointsGapModal(gap) {
        if (!this.elements.pointsModal) return;
        
        this.elements.pointsModal.querySelector('.points-gap').textContent = gap;
        this.elements.pointsModal.classList.add('visible');
    }

    /**
     * Update points display
     */
    updatePointsDisplay() {
        const pointsDisplay = document.querySelector('.user-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = this.state.points;
        }
    }

    /**
     * Show toast message
     * @param {string} message - Message to display
     */
    showToast(message) {
        if (!this.elements.toastSuccess) return;
        
        this.elements.toastSuccess.textContent = message;
        this.elements.toastSuccess.classList.add('visible');
        
        setTimeout(() => {
            this.elements.toastSuccess.classList.remove('visible');
        }, 3000);
    }

    /**
     * Check member status
     * @returns {boolean} Whether user is a member
     */
    checkMemberStatus() {
        return localStorage.getItem('isMember') === 'true';
    }

    /**
     * Load coupons from local storage
     * @returns {Array} List of coupon IDs
     */
    loadCoupons() {
        try {
            return JSON.parse(localStorage.getItem('userCoupons') || '[]');
        } catch (error) {
            console.error('Failed to load coupons:', error);
            return [];
        }
    }

    /**
     * Save coupons to local storage
     */
    saveCoupons() {
        try {
            localStorage.setItem('userCoupons', JSON.stringify([...this.state.coupons]));
        } catch (error) {
            console.error('Failed to save coupons:', error);
        }
    }

    /**
     * Fetch special offer products
     * @returns {Promise<Array>} List of special offer products
     */
    async fetchDeals() {
        try {
            const response = await fetch('/api/deals');
            if (!response.ok) {
                throw new Error('Failed to fetch special offer products');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch special offer products:', error);
            throw error;
        }
    }

    /**
     * Fetch points products
     * @returns {Promise<Array>} List of points products
     */
    async fetchPointsProducts() {
        try {
            const response = await fetch('/api/points-products');
            if (!response.ok) {
                throw new Error('Failed to fetch points products');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch points products:', error);
            throw error;
        }
    }

    /**
     * Get coupon from API
     * @param {string} couponId - Coupon ID
     * @returns {Promise<Object>} Coupon data
     */
    async getCouponAPI(couponId) {
        try {
            const response = await fetch(`/api/coupons/${couponId}`);
            if (!response.ok) {
                throw new Error('Failed to get coupon');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to get coupon:', error);
            throw error;
        }
    }

    /**
     * Get product from API
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Product data
     */
    async getProductAPI(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) {
                throw new Error('Failed to get product');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to get product:', error);
            throw error;
        }
    }

    /**
     * Get points product from API
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Points product data
     */
    async getPointsProductAPI(productId) {
        try {
            const response = await fetch(`/api/points-products/${productId}`);
            if (!response.ok) {
                throw new Error('Failed to get points product');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to get points product:', error);
            throw error;
        }
    }

    /**
     * Add product to cart via API
     * @param {string} productId - Product ID
     * @returns {Promise<void>}
     */
    async addToCartAPI(productId) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });
            if (!response.ok) {
                throw new Error('Failed to add to cart');
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        }
    }

    /**
     * Exchange points product via API
     * @param {string} productId - Product ID
     * @returns {Promise<void>}
     */
    async exchangeAPI(productId) {
        try {
            const response = await fetch('/api/points-exchange', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });
            if (!response.ok) {
                throw new Error('Failed to exchange points');
            }
        } catch (error) {
            console.error('Failed to exchange points:', error);
            throw error;
        }
    }
}

// Initialize deals manager
document.addEventListener('DOMContentLoaded', () => {
    new DealsManager();
}); 