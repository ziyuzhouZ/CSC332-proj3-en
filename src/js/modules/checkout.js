import { cartManager } from './cart.js';
import { userManager } from './user.js';
import { toast } from '../utils/toast.js';

class CheckoutManager {
    constructor() {
        this.addresses = [];
        this.selectedAddressId = null;
        this.selectedCouponId = null;
        this.cartItems = [];
        this.amounts = {
            subtotal: 0,
            shipping: 0,
            discount: 0,
            total: 0
        };

        // Bind event handlers
        this.handleAddressSelection = this.handleAddressSelection.bind(this);
        this.handleCouponSelection = this.handleCouponSelection.bind(this);
        this.handleSubmitOrder = this.handleSubmitOrder.bind(this);
        this.handleAddAddress = this.handleAddAddress.bind(this);
    }

    async init() {
        try {
            // Check login status
            if (!userManager.isLoggedIn()) {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
                return;
            }

            // Load cart items
            this.cartItems = await cartManager.getCartItems();
            if (!this.cartItems.length) {
                window.location.href = '/cart.html';
                return;
            }

            // Load user addresses
            await this.loadAddresses();

            // Calculate initial amounts
            this.calculateAmounts();

            // Bind events
            this.bindEvents();

            // Render initial state
            this.render();
        } catch (error) {
            console.error('Failed to initialize checkout:', error);
            toast.error('Failed to initialize checkout page, please refresh and try again');
        }
    }

    async loadAddresses() {
        try {
            this.addresses = await userManager.getAddresses();
            if (this.addresses.length) {
                this.selectedAddressId = this.addresses[0].id;
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
            toast.error('Failed to load addresses');
        }
    }

    bindEvents() {
        // Address selection
        document.querySelectorAll('.address-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleAddressSelection(item.dataset.addressId);
            });
        });

        // Add new address
        document.querySelector('.btn-add-address')?.addEventListener('click', this.handleAddAddress);

        // Coupon selection
        document.querySelectorAll('.coupon-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleCouponSelection(item.dataset.couponId);
            });
        });

        // Submit order
        document.querySelector('.btn-submit')?.addEventListener('click', this.handleSubmitOrder);

        // Back to cart
        document.querySelector('.btn-back')?.addEventListener('click', () => {
            window.location.href = '/cart.html';
        });
    }

    handleAddressSelection(addressId) {
        this.selectedAddressId = addressId;
        document.querySelectorAll('.address-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.addressId === addressId);
        });
    }

    handleCouponSelection(couponId) {
        this.selectedCouponId = couponId;
        this.calculateAmounts();
        this.renderAmounts();
    }

    async handleAddAddress() {
        const modal = document.querySelector('#addressModal');
        modal.classList.add('active');

        // Handle form submission
        const form = modal.querySelector('form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData(form);
                const address = await userManager.addAddress(Object.fromEntries(formData));
                this.addresses.push(address);
                this.selectedAddressId = address.id;
                this.renderAddresses();
                modal.classList.remove('active');
                toast.success('Address added successfully');
            } catch (error) {
                console.error('Failed to add address:', error);
                toast.error('Failed to add address');
            }
        });
    }

    async handleSubmitOrder() {
        if (!this.validateOrder()) {
            return;
        }

        try {
            const orderData = {
                addressId: this.selectedAddressId,
                couponId: this.selectedCouponId,
                items: this.cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    specs: item.specs
                })),
                amounts: this.amounts
            };

            const order = await this.createOrder(orderData);
            window.location.href = `/payment.html?orderId=${order.id}`;
        } catch (error) {
            console.error('Failed to create order:', error);
            toast.error('Failed to create order, please try again');
        }
    }

    validateOrder() {
        if (!this.selectedAddressId) {
            toast.error('Please select a shipping address');
            return false;
        }

        if (!this.cartItems.length) {
            toast.error('Cart is empty');
            return false;
        }

        return true;
    }

    async createOrder(orderData) {
        // TODO: Implement API call to create order
        return { id: 'mock-order-id' };
    }

    calculateAmounts() {
        // Calculate subtotal
        this.amounts.subtotal = this.cartItems.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        // Calculate shipping fee
        this.amounts.shipping = this.amounts.subtotal >= 199 ? 0 : 10;

        // Apply coupon discount
        this.amounts.discount = this.selectedCouponId ? 10 : 0;

        // Calculate total
        this.amounts.total = this.amounts.subtotal + this.amounts.shipping - this.amounts.discount;
    }

    render() {
        this.renderAddresses();
        this.renderProducts();
        this.renderAmounts();
    }

    renderAddresses() {
        const container = document.querySelector('.address-list');
        if (!container) return;

        container.innerHTML = this.addresses.map(address => `
            <div class="address-item ${address.id === this.selectedAddressId ? 'selected' : ''}" 
                 data-address-id="${address.id}"
                 role="radio"
                 aria-checked="${address.id === this.selectedAddressId}"
                 tabindex="0">
                <div class="address-info">
                    <p class="name">${address.name} ${address.phone}</p>
                    <p class="detail">${address.province} ${address.city} ${address.district}</p>
                    <p class="street">${address.street}</p>
                </div>
            </div>
        `).join('') + `
            <button class="btn-add-address" aria-label="Add new address">
                <span class="icon">+</span>
                <span>Add new address</span>
            </button>
        `;
    }

    renderProducts() {
        const container = document.querySelector('.products-list');
        if (!container) return;

        container.innerHTML = this.cartItems.map(item => `
            <div class="product-item" role="listitem">
                <div class="product-image">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${item.name}</h3>
                    <p class="product-specs">${item.specs.join(' / ')}</p>
                    <p class="product-quantity">x${item.quantity}</p>
                </div>
                <div class="product-price">
                    <span class="currency">¥</span>${item.price.toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    renderAmounts() {
        const container = document.querySelector('.amount-details');
        if (!container) return;

        container.innerHTML = `
            <div class="amount-item">
                <span>Subtotal</span>
                <span>¥${this.amounts.subtotal.toFixed(2)}</span>
            </div>
            <div class="amount-item">
                <span>Shipping</span>
                <span>¥${this.amounts.shipping.toFixed(2)}</span>
            </div>
            <div class="amount-item">
                <span>Discount</span>
                <span>-¥${this.amounts.discount.toFixed(2)}</span>
            </div>
            <div class="amount-item total">
                <span>Total</span>
                <span>¥${this.amounts.total.toFixed(2)}</span>
            </div>
        `;
    }
}

// Initialize checkout manager
document.addEventListener('DOMContentLoaded', () => {
    new CheckoutManager().init();
}); 