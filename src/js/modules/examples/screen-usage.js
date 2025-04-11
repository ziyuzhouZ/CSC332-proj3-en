/**
 * Screen Utility Usage Example
 * Demonstrates how to use screen utilities for responsive design
 */

import ScreenUtils from '../screen.js';

// Initialize screen utilities
const screen = ScreenUtils.init();

/**
 * Adjust product grid layout based on screen size
 */
function adjustProductGrid() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  
  const { width, breakpoint } = screen.getScreenState();
  
  // Remove all existing column classes
  grid.classList.remove('grid-1', 'grid-2', 'grid-3', 'grid-4', 'grid-5');
  
  // Add appropriate column class based on breakpoint
  switch (breakpoint) {
    case 'xs':
      grid.classList.add('grid-1');
      break;
    case 'sm':
      grid.classList.add('grid-2');
      break;
    case 'md':
      grid.classList.add('grid-3');
      break;
    case 'lg':
      grid.classList.add('grid-4');
      break;
    case 'xl':
      grid.classList.add('grid-5');
      break;
  }
  
  // Adjust product card sizes
  const cards = grid.querySelectorAll('.product-card');
  cards.forEach(card => {
    if (width < 768) {
      card.classList.add('mobile-size');
      card.classList.remove('desktop-size');
    } else {
      card.classList.remove('mobile-size');
      card.classList.add('desktop-size');
    }
  });
}

/**
 * Adjust product gallery layout based on screen orientation
 */
function adjustProductGallery() {
  const gallery = document.querySelector('.product-gallery');
  if (!gallery) return;
  
  const { orientation } = screen.getScreenState();
  
  if (orientation === 'portrait') {
    // Stack images vertically on portrait orientation
    gallery.classList.add('vertical-layout');
    gallery.classList.remove('horizontal-layout');
  } else {
    // Arrange images horizontally on landscape orientation
    gallery.classList.remove('vertical-layout');
    gallery.classList.add('horizontal-layout');
  }
}

/**
 * Optimize shopping cart display for different devices
 */
function optimizeShoppingCart() {
  const cart = document.querySelector('.shopping-cart');
  if (!cart) return;
  
  const { width, height } = screen.getScreenState();
  
  if (width < 768) {
    // Mobile cart view
    cart.classList.add('mobile-view');
    cart.classList.remove('desktop-view');
    
    // Adjust cart items for mobile
    const items = cart.querySelectorAll('.cart-item');
    items.forEach(item => {
      item.classList.add('mobile-item');
      item.classList.remove('desktop-item');
    });
    
    // Show mobile-specific controls
    const mobileControls = cart.querySelector('.mobile-controls');
    if (mobileControls) {
      mobileControls.style.display = 'block';
    }
  } else {
    // Desktop cart view
    cart.classList.remove('mobile-view');
    cart.classList.add('desktop-view');
    
    // Adjust cart items for desktop
    const items = cart.querySelectorAll('.cart-item');
    items.forEach(item => {
      item.classList.remove('mobile-item');
      item.classList.add('desktop-item');
    });
    
    // Hide mobile-specific controls
    const mobileControls = cart.querySelector('.mobile-controls');
    if (mobileControls) {
      mobileControls.style.display = 'none';
    }
  }
  
  // Adjust cart height based on screen height
  const maxHeight = height * 0.8; // 80% of screen height
  cart.style.maxHeight = `${maxHeight}px`;
}

/**
 * Initialize all responsive features
 */
function initResponsiveFeatures() {
  // Initial adjustments
  adjustProductGrid();
  adjustProductGallery();
  optimizeShoppingCart();
  
  // Set up event listeners for screen changes
  screen.onResize(() => {
    adjustProductGrid();
    adjustProductGallery();
    optimizeShoppingCart();
  });
  
  screen.onOrientationChange(() => {
    adjustProductGallery();
    optimizeShoppingCart();
  });
  
  console.log('Responsive features initialized');
}

// Export functionality for other modules
export {
  initResponsiveFeatures,
  adjustProductGrid,
  adjustProductGallery,
  optimizeShoppingCart
}; 