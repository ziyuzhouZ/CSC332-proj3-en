// Dropdown menu functionality
document.querySelector('.nav-item').addEventListener('mouseover', function() {
    document.querySelector('.dropdown-menu').style.display = 'block';
});

// Carousel functionality
let currentSlide = 0;
function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

// Product card click event
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function() {
        window.location.href = 'product-detail.html?id=' + this.dataset.id;
    });
});

// Import screen responsive utilities
import ScreenUtils from './modules/screen.js';

// Navigation menu handling
document.addEventListener('DOMContentLoaded', () => {
    // Initialize screen responsive utilities
    const screen = ScreenUtils.init();
    
    // Automatically adjust navigation bar style based on screen size
    function adjustNavigation() {
        const navLinks = document.querySelector('.nav-links');
        const breakpoint = screen.getCurrentBreakpoint();
        
        if (breakpoint === 'xs' || breakpoint === 'sm') {
            navLinks?.classList.add('mobile-nav');
        } else {
            navLinks?.classList.remove('mobile-nav');
            // Ensure menu is visible on desktop
            navLinks?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }
    
    // Initial adjustment and listen for changes
    adjustNavigation();
    screen.onResize(adjustNavigation);
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // Update menu icon state
            const spans = menuToggle.getElementsByTagName('span');
            Array.from(spans).forEach((span, index) => {
                span.style.transform = navLinks.classList.contains('active')
                    ? index === 0 ? 'rotate(45deg) translate(5px, 5px)'
                        : index === 1 ? 'scale(0)'
                            : 'rotate(-45deg) translate(5px, -5px)'
                    : '';
            });
        });
    }

    // Handle dropdown menu expand/collapse on mobile
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', (e) => {
                const { width } = screen.getScreenState();
                if (width <= 768) {
                    e.preventDefault();
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
    });
});

// Scroll handling
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (header) {
        // Hide navigation bar when scrolling down, show when scrolling up
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        // Add shadow effect
        if (scrollTop > 0) {
            header.style.boxShadow = 'var(--shadow-md)';
        } else {
            header.style.boxShadow = 'var(--shadow-sm)';
        }
    }
    
    lastScrollTop = scrollTop;
});

// Shopping cart counter simulation
const cartCount = document.querySelector('.cart-count');
if (cartCount) {
    // Get cart count from localStorage
    const count = localStorage.getItem('cartCount') || 0;
    cartCount.textContent = count;
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Page load animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Responsive image loading
function loadResponsiveImages() {
    const images = document.querySelectorAll('img[data-src]');
    const config = {
        rootMargin: '50px 0px',
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries, self) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.onload = () => img.classList.add('loaded');
                self.unobserve(img);
            }
        });
    }, config);

    images.forEach(img => observer.observe(img));
}

// Initialize responsive image loading
if ('IntersectionObserver' in window) {
    loadResponsiveImages();
}