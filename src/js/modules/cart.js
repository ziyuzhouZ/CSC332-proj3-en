/**
 * Shopping Cart Management Class
 */
class CartManager {
    constructor() {
        console.log('CartManager initialized');
        this.STORAGE_KEY = 'cart_items';
        this.SHIPPING_THRESHOLD = 99; // Free shipping threshold
        this.SHIPPING_FEE = 10; // Base shipping fee

        this.state = {
            items: this.loadCartItems(),
            selectedIds: new Set(),
            drawerVisible: false
        };

        this.elements = {
            container: document.querySelector('.cart-container'),
            cartList: document.querySelector('.cart-list'),
            itemCount: document.querySelector('.item-count'),
            emptyCart: document.querySelector('.empty-cart'),
            cartContent: document.querySelector('.cart-content'),
            selectAll: document.getElementById('selectAll'),
            selectedCount: document.querySelectorAll('.selected-count'),
            totalPrice: document.querySelector('.total-price'),
            discountAmount: document.querySelector('.discount-amount'),
            shippingFee: document.querySelector('.shipping-fee'),
            finalPrice: document.querySelectorAll('.final-price'),
            checkoutBtn: document.querySelectorAll('.btn-checkout'),
            clearBtn: document.querySelector('.btn-clear'),
            drawer: document.querySelector('.cart-drawer'),
            drawerContent: document.querySelector('.drawer-content'),
            closeDrawer: document.querySelector('.cart-drawer .btn-close'),
            removeModal: document.getElementById('removeModal'),
            confirmRemove: document.getElementById('confirmRemove'),
            cancelRemove: document.getElementById('cancelRemove'),
            cartBadge: document.querySelector('.cart-badge')
        };

        this.itemTemplate = document.getElementById('cartItemTemplate');
        this.pendingRemoveId = null;

        this.init();
    }

    /**
     * Initialize shopping cart
     */
    init() {
        // Update cart badge count first - this needs to be done on all pages
        this.updateCartBadge();
        
        // If on cart page, bind events and render cart
        if (this.isCartPage()) {
            this.bindEvents();
            this.renderCart();
        } else {
            // On non-cart pages, only initialize quick add to cart functionality
            this.initQuickAddToCart();
        }
    }
    
    /**
     * Check if currently on cart page
     * @returns {boolean} Whether on cart page
     */
    isCartPage() {
        return window.location.pathname.includes('cart.html');
    }
    
    /**
     * Initialize quick add to cart functionality
     */
    initQuickAddToCart() {
        // On non-cart pages, listen for add to cart buttons
        document.addEventListener('click', (e) => {
            const quickAddBtn = e.target.closest('.btn-quick-add');
            if (quickAddBtn) {
                const productCard = quickAddBtn.closest('.product-card');
                if (productCard && productCard.dataset.id) {
                    // This is just an example, in practice should call API for complete product info
                    this.quickAddToCart(productCard.dataset.id);
                }
            }
        });
    }
    
    /**
     * Quick add product to cart
     * @param {string} productId - Product ID
     */
    quickAddToCart(productId) {
        // In practice, should call API for complete product information
        console.log('Quick adding product to cart:', productId);
        
        // Example: Add a default product
        const newItem = {
            id: productId,
            name: 'Quick Add Product',
            price: 199,
            originalPrice: 299,
            color: 'Default Color',
            size: 'Default Size',
            quantity: 1,
            image: '../public/images/products/product_' + (Math.floor(Math.random() * 12) + 1) + '.jpg'
        };
        
        this.addItem(newItem);
        
        // Show notification
        this.showToast('Added to cart');
    }
    
    /**
     * Show notification message
     * @param {string} message - Message content
     */
    showToast(message) {
        // Simple notification implementation
        alert(message);
    }

    /**
     * Load cart data from local storage
     * @returns {Array} Cart item list
     */
    loadCartItems() {
        try {
            console.log('Loading cart data');
            const items = localStorage.getItem(this.STORAGE_KEY);
            const parsedItems = items ? JSON.parse(items) : [];
            console.log('Loaded cart items count:', parsedItems.length);
            return parsedItems;
        } catch (error) {
            console.error('Failed to load cart data:', error);
            return [];
        }
    }

    /**
     * Save cart data to local storage
     */
    saveCartItems() {
        try {
            console.log('Saving cart data, item count:', this.state.items.length);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state.items));
            this.updateCartBadge();
        } catch (error) {
            console.error('Failed to save cart data:', error);
        }
    }
    
    /**
     * Add item to cart
     * @param {Object} item - Item data
     */
    addItem(item) {
        // Check if item already exists (same ID and specifications)
        const existingItemIndex = this.state.items.findIndex(i => 
            i.id === item.id && i.color === item.color && i.size === item.size
        );
        
        if (existingItemIndex >= 0) {
            // Item exists, increase quantity
            this.state.items[existingItemIndex].quantity += item.quantity || 1;
        } else {
            // Item doesn't exist, add new item
            this.state.items.push(item);
        }
        
        this.saveCartItems();
        
        // If on cart page, update UI
        if (this.isCartPage()) {
            this.renderCart();
        }
    }

    /**
     * Update cart badge
     */
    updateCartBadge() {
        // Find and update cart badge on all pages
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            const totalItems = this.getTotalQuantity();
            cartBadge.textContent = totalItems;
            
            // Add animation effect
            cartBadge.classList.add('pulse');
            setTimeout(() => {
                cartBadge.classList.remove('pulse');
            }, 800);
        }
    }
    
    /**
     * Get total quantity of items in cart
     * @returns {number} Total quantity
     */
    getTotalQuantity() {
        return this.state.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    /**
     * Get total price of selected items
     * @returns {number} Total price
     */
    getSelectedTotalPrice() {
        return this.state.items
            .filter(item => this.state.selectedIds.has(item.id))
            .reduce((total, item) => total + item.price * item.quantity, 0);
    }
    
    /**
     * Get total price of all items
     * @returns {number} Total price
     */
    getTotalPrice() {
        return this.state.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    /**
     * Bind events
     */
    bindEvents() {
        // Select/Deselect all
        if (!this.elements.selectAll) {
            console.error("Select all checkbox not found");
        } else {
            this.elements.selectAll.addEventListener('change', () => {
                const checked = this.elements.selectAll.checked;
                this.toggleSelectAll(checked);
            });
        }

        // Clear cart
        if (!this.elements.clearBtn) {
            console.error("Clear cart button not found");
        } else {
            this.elements.clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the cart?')) {
                    this.clearCart();
                }
            });
        }

        // Checkout button
        if (!this.elements.checkoutBtn || this.elements.checkoutBtn.length === 0) {
            console.error("Checkout button not found");
        } else {
            this.elements.checkoutBtn.forEach(btn => {
                btn.addEventListener('click', () => this.checkout());
            });
        }

        // Close drawer
        if (this.elements.closeDrawer) {
            this.elements.closeDrawer.addEventListener('click', () => {
                this.toggleDrawer(false);
            });
        }

        // Remove item modal
        if (this.elements.confirmRemove) {
            this.elements.confirmRemove.addEventListener('click', () => {
                if (this.pendingRemoveId) {
                    this.removeItem(this.pendingRemoveId);
                    this.closeRemoveModal();
                }
            });
        }

        if (this.elements.cancelRemove) {
            this.elements.cancelRemove.addEventListener('click', () => {
                this.closeRemoveModal();
            });
        }

        // Rebind events after cart items are rendered
        this.rebindItemEvents();
    }

    /**
     * Rebind events for cart items
     */
    rebindItemEvents() {
        // Quantity controls
        document.querySelectorAll('.quantity-control').forEach(control => {
            control.addEventListener('click', (e) => {
                const button = e.target.closest('.quantity-btn');
                if (button) {
                    const itemId = button.closest('.cart-item').dataset.id;
                    const delta = button.classList.contains('increase') ? 1 : -1;
                    this.updateItemQuantity(itemId, delta);
                }
            });
        });

        // Quantity input
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemId = e.target.closest('.cart-item').dataset.id;
                const quantity = parseInt(e.target.value);
                if (quantity > 0) {
                    this.setItemQuantity(itemId, quantity);
                }
            });
        });

        // Select item
        document.querySelectorAll('.select-item').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.closest('.cart-item').dataset.id;
                this.toggleSelectItem(itemId, e.target.checked);
            });
        });

        // Remove item
        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.closest('.cart-item').dataset.id;
                this.showRemoveModal(itemId);
            });
        });
    }

    /**
     * Render cart
     */
    renderCart() {
        if (!this.elements.cartList) return;

        if (this.state.items.length === 0) {
            this.elements.emptyCart.style.display = 'block';
            this.elements.cartContent.style.display = 'none';
            return;
        }

        this.elements.emptyCart.style.display = 'none';
        this.elements.cartContent.style.display = 'block';

        this.elements.cartList.innerHTML = '';
        const fragment = document.createDocumentFragment();

        this.state.items.forEach(item => {
            const element = this.createCartItemElement(item);
            fragment.appendChild(element);
        });

        this.elements.cartList.appendChild(fragment);
        this.updateCartUI();
        this.rebindItemEvents();
    }

    /**
     * Create cart item element
     * @param {Object} item - Item data
     * @returns {HTMLElement} Cart item element
     */
    createCartItemElement(item) {
        const element = this.itemTemplate.content.cloneNode(true);
        const cartItem = element.querySelector('.cart-item');
        
        cartItem.dataset.id = item.id;
        
        // Set item data
        cartItem.querySelector('.item-image').src = item.image;
        cartItem.querySelector('.item-name').textContent = item.name;
        cartItem.querySelector('.item-price').textContent = `¥${item.price}`;
        cartItem.querySelector('.item-color').textContent = item.color;
        cartItem.querySelector('.item-size').textContent = item.size;
        cartItem.querySelector('.quantity-input').value = item.quantity;
        
        // Set selected state
        const checkbox = cartItem.querySelector('.select-item');
        checkbox.checked = this.state.selectedIds.has(item.id);
        
        return cartItem;
    }

    /**
     * Toggle item selection
     * @param {string} id - Item ID
     * @param {boolean} checked - Whether item is selected
     */
    toggleSelectItem(id, checked) {
        if (checked) {
            this.state.selectedIds.add(id);
        } else {
            this.state.selectedIds.delete(id);
        }
        this.updateSelectAllState();
        this.updateTotalPrice();
    }

    /**
     * Toggle select all items
     * @param {boolean} checked - Whether all items are selected
     */
    toggleSelectAll(checked) {
        if (checked) {
            this.state.items.forEach(item => {
                this.state.selectedIds.add(item.id);
            });
        } else {
            this.state.selectedIds.clear();
        }
        this.updateCartUI();
    }

    /**
     * Update select all state
     */
    updateSelectAllState() {
        if (!this.elements.selectAll) return;
        
        const allSelected = this.state.items.length > 0 && 
            this.state.items.every(item => this.state.selectedIds.has(item.id));
        
        this.elements.selectAll.checked = allSelected;
    }

    /**
     * Update total price
     */
    updateTotalPrice() {
        const selectedTotal = this.getSelectedTotalPrice();
        const shippingFee = selectedTotal >= this.SHIPPING_THRESHOLD ? 0 : this.SHIPPING_FEE;
        const finalPrice = selectedTotal + shippingFee;

        // Update selected count
        this.elements.selectedCount.forEach(element => {
            element.textContent = this.state.selectedIds.size;
        });

        // Update prices
        this.elements.totalPrice.textContent = `¥${selectedTotal.toFixed(2)}`;
        this.elements.shippingFee.textContent = `¥${shippingFee.toFixed(2)}`;
        this.elements.finalPrice.forEach(element => {
            element.textContent = `¥${finalPrice.toFixed(2)}`;
        });

        // Update checkout button state
        this.elements.checkoutBtn.forEach(btn => {
            btn.disabled = this.state.selectedIds.size === 0;
        });
    }

    /**
     * Show remove item modal
     * @param {string} id - Item ID
     */
    showRemoveModal(id) {
        this.pendingRemoveId = id;
        this.elements.removeModal.classList.add('visible');
    }

    /**
     * Close remove item modal
     */
    closeRemoveModal() {
        this.pendingRemoveId = null;
        this.elements.removeModal.classList.remove('visible');
    }

    /**
     * Remove item from cart
     * @param {string} id - Item ID
     */
    removeItem(id) {
        this.state.items = this.state.items.filter(item => item.id !== id);
        this.state.selectedIds.delete(id);
        this.saveCartItems();
        this.renderCart();
    }

    /**
     * Clear cart
     */
    clearCart() {
        this.state.items = [];
        this.state.selectedIds.clear();
        this.saveCartItems();
        this.renderCart();
    }

    /**
     * Update cart UI
     */
    updateCartUI() {
        // Update item count
        this.elements.itemCount.textContent = this.getTotalQuantity();

        // Update selected count
        this.elements.selectedCount.forEach(element => {
            element.textContent = this.state.selectedIds.size;
        });

        // Update prices
        this.updateTotalPrice();

        // Update select all state
        this.updateSelectAllState();
    }

    /**
     * Toggle cart drawer
     * @param {boolean} visible - Whether drawer is visible
     */
    toggleDrawer(visible) {
        this.state.drawerVisible = visible;
        this.elements.drawer.classList.toggle('visible', visible);
    }

    /**
     * Checkout
     */
    checkout() {
        if (this.state.selectedIds.size === 0) {
            alert('Please select items to checkout');
            return;
        }

        const selectedItems = this.state.items.filter(item => 
            this.state.selectedIds.has(item.id)
        );

        // In practice, should redirect to checkout page with selected items
        console.log('Checking out items:', selectedItems);
        router.navigate('/checkout');
    }

    /**
     * Update item quantity
     * @param {string} id - Item ID
     * @param {number} delta - Quantity change
     */
    updateItemQuantity(id, delta) {
        const item = this.state.items.find(item => item.id === id);
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                this.saveCartItems();
                this.renderCart();
            }
        }
    }

    /**
     * Set item quantity
     * @param {string} id - Item ID
     * @param {number} quantity - New quantity
     */
    setItemQuantity(id, quantity) {
        const item = this.state.items.find(item => item.id === id);
        if (item) {
            item.quantity = quantity;
            this.saveCartItems();
            this.renderCart();
        }
    }
}

// Initialize cart manager
document.addEventListener('DOMContentLoaded', () => {
    new CartManager();
});
