/**
 * Social Features Manager
 */
class SocialManager {
    constructor() {
        this.state = {
            reviews: {
                page: 1,
                pageSize: 10,
                hasMore: true,
                loading: false,
                filter: 'all'
            },
            favorites: new Set(this.loadFavorites())
        };

        this.elements = {
            reviewsList: document.querySelector('.reviews-list'),
            loadMoreBtn: document.querySelector('.btn-load-more'),
            reviewFilters: document.querySelector('.review-filters'),
            shareModal: document.getElementById('shareModal'),
            shareLink: document.getElementById('shareLink'),
            favoriteBtn: document.querySelector('.btn-favorite'),
            ratingOverview: document.querySelector('.rating-overview'),
            ratingBars: document.querySelector('.rating-bars')
        };

        this.reviewTemplate = document.getElementById('reviewTemplate');
        this.productId = new URLSearchParams(window.location.search).get('id');
    }

    /**
     * Initialize social features
     */
    init() {
        this.bindEvents();
        this.loadReviews();
        this.updateFavoriteState();
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Review filtering
        this.elements.reviewFilters?.addEventListener('click', (e) => {
            const filterBtn = e.target.closest('.filter-btn');
            if (!filterBtn) return;

            this.elements.reviewFilters.querySelector('.active')?.classList.remove('active');
            filterBtn.classList.add('active');
            
            this.state.reviews.filter = filterBtn.dataset.filter;
            this.state.reviews.page = 1;
            this.elements.reviewsList.innerHTML = '';
            this.loadReviews();
        });

        // Load more reviews
        this.elements.loadMoreBtn?.addEventListener('click', () => {
            if (!this.state.reviews.loading && this.state.reviews.hasMore) {
                this.state.reviews.page++;
                this.loadReviews();
            }
        });

        // Share feature
        const shareBtn = document.querySelector('.btn-share');
        shareBtn?.addEventListener('click', () => this.showShareModal());

        // Copy share link
        const copyBtn = document.querySelector('.btn-copy');
        copyBtn?.addEventListener('click', () => this.copyShareLink());

        // Social platform sharing
        const sharePlatforms = document.querySelector('.share-platforms');
        sharePlatforms?.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('.share-btn');
            if (shareBtn) {
                this.shareToPlatform(shareBtn.classList[1]);
            }
        });

        // Close share modal
        this.elements.shareModal?.querySelector('.btn-close').addEventListener('click', () => {
            this.elements.shareModal.classList.remove('visible');
        });

        // Favorite feature
        this.elements.favoriteBtn?.addEventListener('click', () => this.toggleFavorite());

        // Helpful feature
        this.elements.reviewsList?.addEventListener('click', (e) => {
            const helpfulBtn = e.target.closest('.btn-helpful');
            if (helpfulBtn) {
                this.toggleHelpful(helpfulBtn);
            }
        });
    }

    /**
     * Load review list
     */
    async loadReviews() {
        if (this.state.reviews.loading || !this.state.reviews.hasMore) return;

        this.state.reviews.loading = true;
        this.updateLoadingState(true);

        try {
            const response = await this.fetchReviews();
            this.renderReviews(response.reviews);
            this.updateReviewStats(response.stats);

            this.state.reviews.hasMore = response.reviews.length === this.state.reviews.pageSize;
            this.elements.loadMoreBtn.hidden = !this.state.reviews.hasMore;

        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            this.state.reviews.loading = false;
            this.updateLoadingState(false);
        }
    }

    /**
     * Render review list
     * @param {Array} reviews - Review data
     */
    renderReviews(reviews) {
        const fragment = document.createDocumentFragment();

        reviews.forEach(review => {
            const element = this.reviewTemplate.content.cloneNode(true);
            const container = element.querySelector('.review-item');

            // XSS prevention
            const avatar = container.querySelector('.avatar');
            avatar.src = this.sanitizeUrl(review.avatar);
            avatar.alt = this.sanitizeText(review.username);

            container.querySelector('.reviewer-name').textContent = this.sanitizeText(review.username);
            container.querySelector('.review-time').textContent = this.formatDate(review.time);
            container.querySelector('.review-text').textContent = this.sanitizeText(review.content);
            
            // Render star rating
            this.renderStars(container.querySelector('.rating-stars'), review.rating);

            // Render media content
            if (review.media?.length) {
                const mediaContainer = container.querySelector('.review-media');
                review.media.forEach(item => {
                    if (item.type === 'image') {
                        const img = document.createElement('img');
                        img.src = this.sanitizeUrl(item.url);
                        img.alt = 'Review image';
                        mediaContainer.appendChild(img);
                    } else if (item.type === 'video') {
                        const video = document.createElement('video');
                        video.src = this.sanitizeUrl(item.url);
                        video.controls = true;
                        mediaContainer.appendChild(video);
                    }
                });
            }

            // Specification information
            container.querySelector('.color').textContent = this.sanitizeText(review.specs.color);
            container.querySelector('.size').textContent = this.sanitizeText(review.specs.size);

            // Helpful count
            const helpfulBtn = container.querySelector('.btn-helpful');
            helpfulBtn.querySelector('.count').textContent = review.helpful;
            if (review.isHelpful) {
                helpfulBtn.classList.add('active');
            }

            fragment.appendChild(container);
        });

        this.elements.reviewsList.appendChild(fragment);
    }

    /**
     * Update review statistics
     * @param {Object} stats - Statistics data
     */
    updateReviewStats(stats) {
        if (!this.elements.ratingOverview) return;

        const averageRating = stats.averageRating.toFixed(1);
        this.elements.ratingOverview.querySelector('.rating-score').textContent = averageRating;
        this.elements.ratingOverview.querySelector('.total-reviews').textContent = 
            `(${stats.totalReviews} reviews)`;

        this.renderStars(
            this.elements.ratingOverview.querySelector('.rating-stars'),
            stats.averageRating
        );

        // Render rating distribution
        this.elements.ratingBars.innerHTML = '';
        for (let i = 5; i >= 1; i--) {
            const percentage = (stats.ratingDistribution[i] || 0) / stats.totalReviews * 100;
            this.elements.ratingBars.innerHTML += `
                <div class="rating-bar">
                    <span class="star-label">${i} stars</span>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="bar-percent">${percentage.toFixed(1)}%</span>
                </div>
            `;
        }
    }

    /**
     * Render star rating
     * @param {HTMLElement} container - Star rating container
     * @param {number} rating - Rating value
     */
    renderStars(container, rating) {
        container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = `icon-star${i <= rating ? ' filled' : ''}`;
            container.appendChild(star);
        }
    }

    /**
     * Show share modal
     */
    showShareModal() {
        if (!this.elements.shareModal) return;

        // Generate short URL with ref
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('ref', 'share');
        
        this.elements.shareLink.value = shareUrl.href;
        this.elements.shareModal.classList.add('visible');
    }

    /**
     * Copy share link
     */
    async copyShareLink() {
        try {
            await navigator.clipboard.writeText(this.elements.shareLink.value);
            this.showToast('Link copied to clipboard');
        } catch (error) {
            console.error('Failed to copy link:', error);
            this.showToast('Failed to copy link', 'error');
        }
    }

    /**
     * Share to social platform
     * @param {string} platform - Platform name
     */
    shareToPlatform(platform) {
        const url = encodeURIComponent(this.elements.shareLink.value);
        const title = encodeURIComponent(document.title);
        const text = encodeURIComponent('Check out this product!');

        let shareUrl = '';
        switch (platform) {
            case 'weibo':
                shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
                break;
            case 'wechat':
                // WeChat sharing requires QR code
                this.showToast('Please scan the QR code to share', 'info');
                return;
            case 'qq':
                shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'width=600,height=400');
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite() {
        try {
            const isFavorite = this.elements.favoriteBtn.classList.contains('active');
            await this.updateFavoriteAPI(!isFavorite);
            
            this.elements.favoriteBtn.classList.toggle('active');
            this.updateFavoriteState();
            
            this.showToast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            console.error('Failed to update favorite status:', error);
            this.showToast('Operation failed, please try again', 'error');
        }
    }

    /**
     * Update favorite button state
     */
    updateFavoriteState() {
        if (!this.elements.favoriteBtn) return;
        
        const isFavorite = this.state.favorites.has(this.productId);
        this.elements.favoriteBtn.classList.toggle('active', isFavorite);
        this.elements.favoriteBtn.setAttribute('aria-pressed', isFavorite);
    }

    /**
     * Load favorites from localStorage
     * @returns {Array} Favorite product IDs
     */
    loadFavorites() {
        try {
            const favorites = localStorage.getItem('favorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Failed to load favorites:', error);
            return [];
        }
    }

    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem('favorites', JSON.stringify([...this.state.favorites]));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    /**
     * Toggle helpful status
     * @param {HTMLElement} button - Helpful button
     */
    async toggleHelpful(button) {
        try {
            const reviewId = button.closest('.review-item').dataset.id;
            const isHelpful = button.classList.contains('active');
            
            await this.updateHelpfulAPI(reviewId, !isHelpful);
            
            button.classList.toggle('active');
            const countElement = button.querySelector('.count');
            const currentCount = parseInt(countElement.textContent);
            countElement.textContent = isHelpful ? currentCount - 1 : currentCount + 1;
            
            this.showToast(isHelpful ? 'Removed helpful vote' : 'Added helpful vote');
        } catch (error) {
            console.error('Failed to update helpful status:', error);
            this.showToast('Operation failed, please try again', 'error');
        }
    }

    /**
     * Update loading state
     * @param {boolean} loading - Whether loading
     */
    updateLoadingState(loading) {
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.disabled = loading;
            this.elements.loadMoreBtn.textContent = loading ? 'Loading...' : 'Load More';
        }
    }

    /**
     * Show toast message
     * @param {string} message - Message content
     * @param {string} type - Message type
     */
    showToast(message, type = 'success') {
        if (window.router && window.router.showToast) {
            window.router.showToast(message, type);
        }
    }

    /**
     * Format date
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted date
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Sanitize text
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        return text.replace(/[<>]/g, '');
    }

    /**
     * Sanitize URL
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL
     */
    sanitizeUrl(url) {
        try {
            return new URL(url).toString();
        } catch {
            return '';
        }
    }

    /**
     * Fetch reviews from API
     * @returns {Promise} Review data
     */
    async fetchReviews() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulated data
        return {
            reviews: Array(10).fill(null).map((_, index) => ({
                id: index + 1,
                username: 'User' + (index + 1),
                avatar: '../public/images/avatars/avatar_' + (index % 5 + 1) + '.jpg',
                rating: Math.floor(Math.random() * 5) + 1,
                content: 'Great product! Very satisfied with the quality.',
                time: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
                specs: {
                    color: 'Black',
                    size: 'M'
                },
                helpful: Math.floor(Math.random() * 100),
                isHelpful: false
            })),
            stats: {
                averageRating: 4.5,
                totalReviews: 100,
                ratingDistribution: {
                    5: 50,
                    4: 30,
                    3: 10,
                    2: 5,
                    1: 5
                }
            }
        };
    }

    /**
     * Update favorite status via API
     * @param {boolean} favorite - Whether to favorite
     */
    async updateFavoriteAPI(favorite) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (favorite) {
            this.state.favorites.add(this.productId);
        } else {
            this.state.favorites.delete(this.productId);
        }
        
        this.saveFavorites();
    }

    /**
     * Update helpful status via API
     * @param {string} reviewId - Review ID
     * @param {boolean} helpful - Whether helpful
     */
    async updateHelpfulAPI(reviewId, helpful) {
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// Export social features manager
export const socialManager = new SocialManager(); 