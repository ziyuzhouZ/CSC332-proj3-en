/**
 * Admin Authentication Interceptor
 * Intercepts all fetch requests and handles authentication-related responses
 */

// Ensure interceptor is initialized only once
if (typeof window.adminAuthInterceptorInitialized === 'undefined') {
    console.log('Initializing admin authentication interceptor');
    
    // Save original fetch method
    const originalFetch = window.fetch;
    
    // Override fetch method - Simulate responses for specific admin API requests
    window.fetch = async function(url, options) {
        const urlString = url.toString();
        
        // Match admin API requests
        if (urlString.includes('/api/admin/auth/')) {
            console.log('Intercepting admin API request:', urlString);
            
            // Create delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Simulate login response
            if (urlString.includes('/api/admin/auth/login')) {
                const body = JSON.parse(options.body);
                
                // Hardcoded account verification
                if (body.username === 'admin' && body.password === 'admin123') {
                    return new Response(JSON.stringify({
                        success: true,
                        token: 'mock-admin-token-' + Date.now(),
                        admin: {
                            id: 1,
                            username: body.username,
                            email: 'admin@example.com'
                        }
                    }));
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Incorrect username or password'
                    }), { status: 401 });
                }
            }
            
            // Simulate registration response
            if (urlString.includes('/api/admin/auth/register')) {
                const body = JSON.parse(options.body);
                
                // Verify invitation code
                if (body.inviteCode === '6666') {
                    return new Response(JSON.stringify({
                        success: true,
                        token: 'mock-admin-token-' + Date.now(),
                        admin: {
                            id: 1,
                            username: body.username,
                            email: body.email
                        }
                    }));
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Invalid invitation code'
                    }), { status: 400 });
                }
            }
            
            // Simulate validation response
            if (urlString.includes('/api/admin/auth/validate')) {
                // If there's an authorization header, consider it valid
                if (options.headers && options.headers.Authorization) {
                    return new Response(JSON.stringify({
                        success: true,
                        admin: {
                            id: 1,
                            username: 'admin',
                            email: 'admin@example.com'
                        }
                    }));
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: 'Unauthorized access'
                    }), { status: 401 });
                }
            }
        }
        
        // For other requests, use original fetch method
        return originalFetch(url, options);
    };
    
    // Mark interceptor as initialized
    window.adminAuthInterceptorInitialized = true;
    
    // Check if on admin page without token
    document.addEventListener('DOMContentLoaded', function() {
        const isAdminPage = window.location.pathname.includes('/admin/') &&
                          !window.location.pathname.includes('/admin/login.html') &&
                          !window.location.pathname.includes('/admin/register.html');
        
        if (isAdminPage && !localStorage.getItem('admin_token')) {
            console.log('On admin page but not logged in, redirecting to login page');
            window.location.href = '/html/admin/login.html';
        }
    });
} 