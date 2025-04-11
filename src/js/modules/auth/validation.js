/**
 * Password strength check
 * @param {string} password - Password to check
 * @returns {Object} Contains password strength score and pattern matching results
 */
function checkPasswordStrength(password) {
    let strength = 0;
    const patterns = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength += patterns.length ? 1 : 0;
    strength += (patterns.lowercase && patterns.uppercase) ? 1 : 0;
    strength += patterns.numbers ? 1 : 0;
    strength += patterns.special ? 1 : 0;

    return {
        score: strength,
        level: strength <= 1 ? 'weak' : strength <= 2 ? 'medium' : 'strong',
        patterns
    };
}

/**
 * Verification code countdown
 * @param {HTMLButtonElement} button - Send verification code button
 */
function startCountdown(button) {
    let timer = 60;
    button.disabled = true;
    
    const updateButton = () => {
        button.querySelector('.countdown').textContent = `(${timer}s)`;
        if (timer === 0) {
            clearInterval(interval);
            button.disabled = false;
            button.querySelector('span:first-child').textContent = 'Resend';
            button.querySelector('.countdown').textContent = '';
        }
        timer--;
    };

    updateButton();
    const interval = setInterval(updateButton, 1000);
}

/**
 * Show error message
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showError(input, message) {
    const tooltip = input.closest('.input-group').querySelector('.error-tooltip');
    tooltip.querySelector('span').textContent = message;
    tooltip.classList.add('visible');
    input.classList.add('error');
}

/**
 * Hide error message
 * @param {HTMLElement} input - Input element
 */
function hideError(input) {
    const tooltip = input.closest('.input-group').querySelector('.error-tooltip');
    tooltip.classList.remove('visible');
    input.classList.remove('error');
}

// Import API module
import { checkUsername, safeParseJSON, login, register } from './api.js';

/**
 * Username validation
 * @param {string} username - Username to validate
 * @returns {Promise<boolean>} Whether the username already exists
 */
async function validateUsername(username) {
    try {
        // Use checkUsername function from api.js
        const data = await checkUsername(username);
        return data.exists;
    } catch (error) {
        console.error('Error validating username:', error);
        return false;
    }
}

/**
 * Initialize form validation
 */
function initFormValidation() {
    // Check if it's a registration form
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        initRegisterForm(registerForm);
    } else if (loginForm) {
        initLoginForm(loginForm);
    }
}

/**
 * Initialize registration form
 * @param {HTMLFormElement} form - Registration form
 */
function initRegisterForm(form) {
    // Password strength check
    const passwordInput = form.querySelector('input[name="password"]');
    if (passwordInput) {
        const strengthBar = form.querySelector('.strength-level');
        const strengthText = form.querySelector('.strength-text');

        passwordInput.addEventListener('input', () => {
            const { level, patterns } = checkPasswordStrength(passwordInput.value);
            
            strengthBar.className = 'strength-level ' + level;
            strengthText.textContent = `Password strength: ${
                level === 'weak' ? 'Weak' : 
                level === 'medium' ? 'Medium' : 'Strong'
            }`;

            if (!patterns.length) {
                showError(passwordInput, 'Password must be at least 8 characters');
            } else if (!(patterns.lowercase && patterns.uppercase)) {
                showError(passwordInput, 'Password must include both uppercase and lowercase letters');
            } else if (!patterns.numbers) {
                showError(passwordInput, 'Password must include numbers');
            } else {
                hideError(passwordInput);
            }
        });
    }

    // Confirm password validation
    const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value !== passwordInput.value) {
                showError(confirmPasswordInput, 'Passwords do not match');
            } else {
                hideError(confirmPasswordInput);
            }
        });
    }

    // Username validation
    const usernameInput = form.querySelector('input[name="username"]');
    if (usernameInput) {
        let timeout;
        usernameInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                if (usernameInput.value.length < 3) {
                    showError(usernameInput, 'Username must be at least 3 characters');
                    return;
                }

                const exists = await validateUsername(usernameInput.value);
                if (exists) {
                    showError(usernameInput, 'This username is already taken');
                } else {
                    hideError(usernameInput);
                }
            }, 500);
        });
    }

    // Toggle password visibility
    const toggleButtons = form.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.querySelector('i').className = `icon-${type === 'password' ? 'eye' : 'eye-off'}`;
        });
    });

    // Register form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');

        try {
            const formData = new FormData(form);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            // Use register function from api.js instead of direct fetch
            const data = await register(userData);
            
            // Show success message
            form.closest('.auth-card').style.display = 'none';
            document.querySelector('.success-message').classList.add('visible');
        } catch (error) {
            alert(error.message || 'An error occurred during registration');
        } finally {
            submitButton.classList.remove('loading');
        }
    });
}

/**
 * Initialize login form
 * @param {HTMLFormElement} form - Login form
 */
function initLoginForm(form) {
    // Toggle password visibility
    const toggleButtons = form.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.querySelector('i').className = `icon-${type === 'password' ? 'eye' : 'eye-off'}`;
        });
    });

    // Login form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');

        try {
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            // Use login function from api.js instead of direct fetch
            const data = await login(credentials);
            
            // Show success animation
            const animation = document.querySelector('#successAnimation');
            if (animation) {
                animation.style.display = 'block';
            }
            
            // Redirect to user center instead of homepage
            setTimeout(() => {
                window.location.href = '../user-center/index.html';
            }, 1000);
        } catch (error) {
            alert(error.message || 'Login failed');
        } finally {
            submitButton.classList.remove('loading');
        }
    });
}

// Initialize validation when DOM is loaded
document.addEventListener('DOMContentLoaded', initFormValidation);

// Make toggle password buttons work
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        this.querySelector('i').className = `icon-${type === 'password' ? 'eye' : 'eye-off'}`;
    });
});

// Export the validation functions
export {
    checkPasswordStrength,
    validateUsername,
    showError,
    hideError,
    startCountdown
}; 