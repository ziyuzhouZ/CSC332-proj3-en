# Admin System Documentation

This is the admin backend system for the Fashion Website e-commerce platform, providing admin login, registration, and basic management features including store management, sales data analysis, and order management.

## Features

- Admin login and registration
- Invitation code-based registration system
- Admin permission verification
- Sales data analysis and chart display
- Store management
- Order processing and status management
- Persistent login status

## Usage Guide

### Admin Login

1. Access admin login page: `/html/admin/login.html`
2. Enter default admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click login, will redirect to admin dashboard upon success

### Admin Registration

1. Access admin one-time registration page: `/html/admin/register.html`
2. Fill in form information including username, email, password, and invitation code
3. Invitation code is: `6666`
4. Submit form, will redirect to admin dashboard upon successful registration

### Dashboard Features

The admin dashboard provides main management features for the e-commerce system:

1. **Sales Overview**: Displays total sales, best-selling products, and sales trend charts
2. **Store Management**: View and manage store information and inventory
3. **Order Management**: Process orders and update order status
4. **User Management**: View and manage user accounts (under development)

## File Structure

- `src/html/admin/` - Admin page HTML files
  - `login.html` - Admin login page
  - `register.html` - Admin registration page
  - `dashboard.html` - Admin dashboard
  - `stores.html` - Store management page
  - `store-detail.html` - Store detail page
  - `orders.html` - Order management page
  - `sales.html` - Sales data analysis page
  - `invite.html` - Invitation code management page
  
- `src/js/api/admin/` - Admin API related JS files
  - `auth-interceptor.js` - Authentication interceptor
  - `sqlite-invites.js` - Invitation code management (SQLite version)
  - `invites.js` - Invitation code management

- `src/css/pages/admin.css` - Admin page styles

## Technical Implementation

This admin system is implemented using the following technologies:

1. **Frontend**:
   - Vanilla JavaScript
   - Chart.js (data visualization)
   - CSS3 Flexbox and Grid layout
   
2. **Backend**:
   - Invitation code verification (hardcoded as 6666)
   - localStorage-based session management
   - Simplified authentication interceptor

3. **Data Management**:
   - Mock API response handling
   - Local storage for admin information

## Security Features

Current system is a demo version with the following security features:

1. Admin page access restrictions (login required)
2. Invitation code verification mechanism
3. Session status verification

## Pending Features

1. **User Management**:
   - Add user management page
   - User permission management
   - User activity logs

2. **Product Management**:
   - Add, edit, and delete products
   - Product category management
   - Price and inventory updates

3. **Permission System**:
   - Different admin level permissions
   - Operation auditing
   - Sensitive operation confirmation

4. **Data Synchronization**:
   - Synchronization with actual database
   - Real-time data updates
   - Data backup and recovery

## Invitation Code Information

- The system uses invitation codes to control admin registration
- Current invitation code is hardcoded as `6666`
- Invitation code is verified during registration

## Important Notes

This is just a demonstration system. In a production environment, more comprehensive security measures should be implemented, such as:

1. Using HTTPS for secure transmission
2. Implementing stricter permission control
3. Using server-side session management
4. Implementing operation logs and auditing
5. Adding CSRF and XSS protection 