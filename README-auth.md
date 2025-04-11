# Authentication System Documentation

This is a simple login and registration system based on SQLite3, currently without email verification. The system is integrated with the Fashion Website e-commerce project.

## Features

- User registration and login
- Encrypted password storage
- Session management
- User information storage using SQLite3 database
- Secure JSON parsing and error handling
- CORS support and OPTIONS request handling
- Persistent login status
- User center page
- Logout functionality
- Integration with shopping cart system

## System Requirements

- Node.js (14.x or above)
- npm (6.x or above)

## Installation and Running

1. Ensure Node.js and npm are installed
2. Clone or download the project
3. Run the following commands in the project root directory:

```bash
# Run startup script
./start.sh
```

Or execute manually:

```bash
# Install dependencies
npm install

# Start server
node server.js
```

4. The server will start at http://localhost:3000
5. Access the following URLs in your browser:
   - Registration page: http://localhost:3000/html/auth/register.html
   - Login page: http://localhost:3000/html/auth/login.html
   - User center: http://localhost:3000/html/user-center/index.html (login required)

## Integration with E-commerce Website

The authentication system integrates with the e-commerce website in the following ways:

1. **Navigation Bar User Status**: All pages' top navigation bars display different content based on user login status
2. **Shopping Cart Synchronization**: Logged-in users' cart information is automatically synchronized
3. **Wishlist**: Logged-in users can add products to wishlist and view them in user center
4. **Order Management**: Logged-in users can view and manage orders
5. **Personal Information**: Users can manage personal information in user center

## File Structure

- `server.js` - Express server and SQLite3 database configuration
- `src/html/auth/` - Login and registration pages
- `src/js/modules/auth/` - Frontend authentication related JS files
  - `api.js` - API requests and session management
  - `validation.js` - Form validation and submission handling
  - `session.js` - Session state management and navigation bar updates
- `src/html/user-center/` - User center pages
- `users.db` - SQLite3 database file (created automatically on first run)

## Account Registration Process

1. Access registration page
2. Fill in username, email, and password
3. Click register button
4. Redirect to login page upon success

## Login Process

1. Access login page
2. Enter email and password
3. Click login button
4. Redirect to user center page upon success

## User Center and Logout Functionality

1. Redirect to user center page after successful login
2. User center page displays user information and feature menu
3. Click "Logout" button in user center to log out
4. Clear session information and redirect to home page after logout
5. Session status is maintained across all pages (using localStorage)

## Security Notes

- Passwords are stored using PBKDF2 encryption
- Randomly generated salt values enhance security
- Simple session management (using localStorage)
- Secure JSON parsing and error handling
- Added CORS support and preflight request handling
- User center page login status checking

## Troubleshooting Guide

### Handling "Unexpected end of JSON input" Error

Possible causes:
1. Server response is not valid JSON
2. Server did not set correct Content-Type header
3. Network error caused incomplete response

Solutions:
- Server forces Content-Type header to application/json
- Frontend uses safeParseJSON function for secure JSON parsing
- Added comprehensive error catching and logging

### Handling "405 Method Not Allowed" Error

Possible causes:
1. Frontend HTTP method doesn't match server expectations
2. Server not properly handling preflight (OPTIONS) requests
3. Inconsistent API call methods in frontend code

Solutions:
- Added CORS middleware to handle preflight requests
- Explicitly specify API request methods (GET, POST, etc.)
- Unified frontend API calling methods, avoiding mixing direct fetch and API modules
- Added request logs for debugging

### Handling Unresponsive Logout Button

Possible causes:
1. Event listener binding error
2. Nested DOMContentLoaded events causing timing issues
3. JavaScript error interrupting execution

Solutions:
- Removed nested DOMContentLoaded events
- Used direct onclick attribute for event binding
- Added debug logs to track execution flow
- Ensure DOM elements exist before binding events

### Handling Non-persistent Login Status

Possible causes:
1. No shared login status checking logic between pages
2. localStorage storage or reading errors
3. Navigation bar status not properly updated

Solutions:
- Created unified session management module
- Used same status checking logic across all pages
- Added navigation bar user status update function
- Ensured localStorage correctly stores session information

## Important Notes

This is just a simple demonstration system. In a production environment, more comprehensive security measures should be implemented, such as:

1. Using HTTPS for secure transmission
2. Implementing login failure limits
3. Adding two-factor authentication
4. Implementing password complexity requirements
5. Using more secure server-side session management
6. Adding CSRF and XSS protection

## Admin Authentication

The admin login and registration system is a separate authentication system from the user authentication system, providing stricter permission control.
- Admin registration requires invitation code
- Admin can access admin backend after login

For details, please refer to [README-admin.md](./README-admin.md) 