# Fashion Website

A modern fashion e-commerce website built with vanilla JavaScript.

## Project Structure

```
fashion-website/
├── src/
│   ├── html/                     # HTML pages
│   │   ├── index.html           # Home page
│   │   ├── shop.html            # Product list page
│   │   ├── product-detail.html  # Product detail page
│   │   ├── cart.html            # Shopping cart page
│   │   ├── checkout.html        # Checkout page
│   │   ├── deals.html           # Special offers page
│   │   ├── auth/                # Authentication related pages
│   │   ├── user-center/         # User center pages
│   │   └── about-pages/         # About us and info pages
│   │   └── admin/               # Admin backend pages (partially implemented)
│   │
│   ├── css/                     # Style files
│   │   ├── main.css            # Main style file
│   │   ├── components/         # Component styles
│   │   └── pages/             # Page-specific styles
│   │
│   ├── js/                      # JavaScript files
│   │   ├── main.js            # Main entry file
│   │   ├── modules/           # Feature modules
│   │   │   ├── cart.js        # Shopping cart management
│   │   │   ├── product.js     # Product detail management
│   │   │   ├── shop.js        # Product list management
│   │   │   ├── auth/          # Authentication related features
│   │   │   └── user/          # User center features
│   │   └── utils/             # Utility functions
│   │   └── lib/               # Third-party libraries (currently empty)
│   │
│   └── public/                  # Static resources
│       ├── images/            # Image resources
│       └── fonts/            # Font files
│
├── server.js                    # Simple backend server
├── package.json                 # Project dependencies configuration
├── start.sh                     # Startup script
├── dev.sh                       # Development environment script
└── README.md                    # Project documentation
```

## Feature Modules

### 1. Home Page (index.html)
- Carousel display
- New arrivals
- Popular categories
- Brand story
- Navigation menu

### 2. Product Display
- Product List Page (shop.html)
  - Category filtering
  - Price sorting
  - Pagination
  - Quick add to cart
- Product Detail Page (product-detail.html)
  - Image gallery
  - Specification selection
  - Quantity selection
  - Add to cart
  - Buy now
  - Product reviews
  - Share functionality
  - Wishlist functionality

### 3. Shopping Cart System (cart.html)
- Product list display
- Quantity modification (increase/decrease)
- Product selection (single/all)
- Price calculation (original price, discount, total)
- Clear cart
- Checkout functionality
- Cart icon quantity synchronization

### 4. Marketing Features (deals.html)
- Limited time offers
- Coupon redemption
- Points mall
- Member exclusive prices
- Promotional activities

### 5. User Center
- Personal information management
- Order management
- Shipping address management
- Wishlist
- Points details

### 6. Authentication System
- User registration
- User login
- Password recovery
- Third-party login

## Recent Improvements

### Shopping Cart Feature Improvements
- Fixed unresponsive increment/decrement buttons
- Improved price updates after product selection
- Enhanced select all functionality
- Optimized clear cart functionality
- Implemented real-time cart icon quantity updates across the site
- Optimized price calculation logic

### Product Detail Page Improvements
- Synchronized product detail page data with shop.js data
- Automatic cart icon updates after adding to cart
- Enhanced color and size selection functionality
- Optimized image browsing experience
- Implemented wishlist functionality

## Page Relationships

1. Home Page (index.html)
   - → Product List Page (shop.html)
   - → Product Detail Page (product-detail.html)
   - → Special Offers Page (deals.html)
   - → Shopping Cart (cart.html)
   - → User Center
   - → Login/Registration Page

2. Product List Page (shop.html)
   - → Product Detail Page (product-detail.html)
   - → Shopping Cart (cart.html)

3. Product Detail Page (product-detail.html)
   - → Shopping Cart (cart.html)
   - → Checkout Page (checkout.html)
   - → Comments Section

4. Shopping Cart (cart.html)
   - → Checkout Page (checkout.html)
   - → Product Detail Page (product-detail.html)
   - → Product List Page (shop.html)

5. Checkout Page (checkout.html)
   - → Payment Page
   - → Shopping Cart (cart.html)

6. Special Offers Page (deals.html)
   - → Product Detail Page (product-detail.html)
   - → Shopping Cart (cart.html)
   - → Points Mall

## Tech Stack

- Vanilla JavaScript (ES6+)
- CSS3 (Flexbox & Grid)
- HTML5
- Local Storage
- Modular development
- SQLite3 (for authentication system)
- Express.js (simple backend service)

## Data Storage

The project uses LocalStorage to store the following data:

1. Shopping cart product information (`cart_items`)
2. User session information (`auth_token`)
3. User wishlist information (`favorites`)
4. Browsing history (`view_history`)

## Pending Features

1. User System
   - Complete user personal center
   - Order management system
   - Shipping address management
   - Coupon management

2. Payment System
   - Order confirmation page
   - Payment process
   - Order status tracking

3. Search System
   - Product search
   - Search history
   - Popular search recommendations

4. Performance Optimization
   - Image lazy loading
   - Resource compression
   - Cache strategy
   - Performance monitoring

5. Admin Backend
   - Product management
   - Order management
   - User management
   - Marketing activity management

## Development Guide

1. Clone the project
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
./dev.sh
# or
npm run dev
```

4. Start authentication system
```bash
./start.sh
# or
node server.js
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Authentication System

For detailed authentication system documentation, please refer to [README-auth.md](./README-auth.md)

## Admin System

The project now includes an admin backend system that supports:
- Admin login authentication
- Registration based on invitation codes
- Sales data analysis
- Store and order management

For detailed admin system documentation, please refer to [README-admin.md](./README-admin.md)

## License

MIT

## Routing Instructions

### Page Routes
```
/ (index.html)                    # Home page
/shop                             # Product list page
  ?category={category}            # Filter by category
  ?page={page}                    # Pagination
  ?sort={sort}                    # Sorting method
/product-detail                   # Product detail page
  ?id={productId}                # Product ID
/cart                            # Shopping cart page
/checkout                        # Checkout page
  ?from=cart                     # Checkout from cart
  ?from=buy_now&product={id}     # Buy now
/deals                           # Special offers page
/auth/
  login                          # Login page
  register                       # Registration page
/user-center/                    # User center
  profile                        # Personal information
  orders/                        # Order management
    list                        # Order list
    detail?id={orderId}         # Order detail
/about-pages/                    # About pages
  brand-story                   # Brand story
  contact                       # Contact us
  careers                       # Join us
  shopping-guide                # Shopping guide
  shipping-returns              # Shipping and returns
  faq                          # Frequently asked questions
```

### Dynamic Route Handling
1. Product Detail Page (product-detail.html)
   - URL parameter: id (required)
   - Fallback logic: Invalid ID redirects to product list page

2. Order Detail Page (orders/detail.html)
   - URL parameter: id (required)
   - Fallback logic: Invalid ID redirects to order list page

3. Checkout Page (checkout.html)
   - URL parameter: from (required, cart or buy_now)
   - Product parameter: product (required for buy_now)
   - Fallback logic: Invalid parameters redirect to cart page

### Page Access Control
- User center page requires login
- Checkout page requires login
- Member-exclusive section of special offers page requires login
