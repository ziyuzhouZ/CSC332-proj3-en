/**
 * Form Validation Rules
 */
const rules = {
    // Username validation rules
    username: {
        required: true,
        pattern: /^[a-zA-Z0-9_-]{3,20}$/,
        message: {
            required: 'Please enter username',
            pattern: 'Username can only contain letters, numbers, underscores, and hyphens, 3-20 characters long'
        }
    },
    
    // Phone number validation rules
    phone: {
        required: true,
        pattern: /^1[3-9]\d{9}$/,
        message: {
            required: 'Please enter phone number',
            pattern: 'Please enter a valid phone number'
        }
    },
    
    // Email validation rules
    email: {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: {
            required: 'Please enter email',
            pattern: 'Please enter a valid email address'
        }
    },
    
    // Password validation rules
    password: {
        required: true,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message: {
            required: 'Please enter password',
            pattern: 'Password must contain uppercase and lowercase letters and numbers, at least 8 characters long'
        }
    },
    
    // Confirm password validation rules
    confirmPassword: {
        required: true,
        validator: (value, form) => value === form.password.value,
        message: {
            required: 'Please confirm password',
            validator: 'Passwords do not match'
        }
    },
    
    // Address validation rules
    address: {
        required: true,
        minLength: 5,
        maxLength: 100,
        message: {
            required: 'Please enter detailed address',
            minLength: 'Address must be at least 5 characters long',
            maxLength: 'Address cannot exceed 100 characters'
        }
    }
};

/**
 * Form Validator
 */
class FormValidator {
    /**
     * Constructor
     * @param {HTMLFormElement} form - Form element
     * @param {Object} customRules - Custom validation rules
     */
    constructor(form, customRules = {}) {
        this.form = form;
        this.rules = { ...rules, ...customRules };
        this.errors = new Map();
        
        this.bindEvents();
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        // Real-time validation
        this.form.addEventListener('input', (e) => {
            const field = e.target;
            const name = field.name;
            
            if (this.rules[name]) {
                this.validateField(field);
            }
        });
        
        // Submit validation
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.validateForm()) {
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                
                // Trigger form submit event
                this.form.dispatchEvent(new CustomEvent('formSubmit', {
                    detail: { data }
                }));
            }
        });
    }
    
    /**
     * Validate single field
     * @param {HTMLElement} field - Form field
     * @returns {boolean} Validation result
     */
    validateField(field) {
        const name = field.name;
        const value = field.value;
        const rule = this.rules[name];
        
        if (!rule) return true;
        
        // Clear previous errors
        this.clearError(field);
        
        // Required field validation
        if (rule.required && !value) {
            this.showError(field, rule.message.required);
            return false;
        }
        
        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            this.showError(field, rule.message.pattern);
            return false;
        }
        
        // Length validation
        if (rule.minLength && value.length < rule.minLength) {
            this.showError(field, rule.message.minLength);
            return false;
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
            this.showError(field, rule.message.maxLength);
            return false;
        }
        
        // Custom validation
        if (rule.validator && !rule.validator(value, this.form)) {
            this.showError(field, rule.message.validator);
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate entire form
     * @returns {boolean} Validation result
     */
    validateForm() {
        let isValid = true;
        
        // Clear all errors
        this.clearAllErrors();
        
        // Validate all fields
        for (const [name, rule] of Object.entries(this.rules)) {
            const field = this.form.elements[name];
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Show error message
     * @param {HTMLElement} field - Form field
     * @param {string} message - Error message
     */
    showError(field, message) {
        const errorElement = this.createErrorElement(message);
        field.classList.add('error');
        field.parentNode.appendChild(errorElement);
        this.errors.set(field, errorElement);
    }
    
    /**
     * Clear field error
     * @param {HTMLElement} field - Form field
     */
    clearError(field) {
        const errorElement = this.errors.get(field);
        if (errorElement) {
            errorElement.remove();
            this.errors.delete(field);
        }
        field.classList.remove('error');
    }
    
    /**
     * Clear all errors
     */
    clearAllErrors() {
        for (const [field] of this.errors) {
            this.clearError(field);
        }
    }
    
    /**
     * Create error message element
     * @param {string} message - Error message
     * @returns {HTMLElement} Error message element
     */
    createErrorElement(message) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;
        return error;
    }
}

/**
 * Address Form Validator
 */
export class AddressFormValidator extends FormValidator {
    constructor(form) {
        super(form, {
            // Receiver name validation rules
            receiver: {
                required: true,
                pattern: /^[\u4e00-\u9fa5a-zA-Z]{2,20}$/,
                message: {
                    required: 'Please enter receiver name',
                    pattern: 'Receiver name can only contain Chinese or English characters, 2-20 characters long'
                }
            },
            
            // Postal code validation rules
            zipCode: {
                required: true,
                pattern: /^\d{6}$/,
                message: {
                    required: 'Please enter postal code',
                    pattern: 'Please enter a valid 6-digit postal code'
                }
            }
        });
        
        this.initRegionSelect();
    }
    
    /**
     * Initialize region selection
     */
    initRegionSelect() {
        const provinceSelect = this.form.elements['province'];
        const citySelect = this.form.elements['city'];
        const districtSelect = this.form.elements['district'];
        
        if (provinceSelect) {
            this.loadProvinces(provinceSelect);
            
            provinceSelect.addEventListener('change', () => {
                citySelect.innerHTML = '<option value="">Select City</option>';
                districtSelect.innerHTML = '<option value="">Select District</option>';
                
                if (provinceSelect.value) {
                    this.loadCities(citySelect, provinceSelect.value);
                }
            });
        }
        
        if (citySelect) {
            citySelect.addEventListener('change', () => {
                districtSelect.innerHTML = '<option value="">Select District</option>';
                
                if (citySelect.value) {
                    this.loadDistricts(districtSelect, provinceSelect.value, citySelect.value);
                }
            });
        }
    }
    
    /**
     * Load provinces
     * @param {HTMLSelectElement} select - Province select element
     */
    async loadProvinces(select) {
        try {
            const response = await fetch('/api/regions/provinces');
            const provinces = await response.json();
            
            select.innerHTML = '<option value="">Select Province</option>';
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province.code;
                option.textContent = province.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load provinces:', error);
        }
    }
    
    /**
     * Load cities
     * @param {HTMLSelectElement} select - City select element
     * @param {string} provinceCode - Province code
     */
    async loadCities(select, provinceCode) {
        try {
            const response = await fetch(`/api/regions/cities?province=${provinceCode}`);
            const cities = await response.json();
            
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.code;
                option.textContent = city.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load cities:', error);
        }
    }
    
    /**
     * Load districts
     * @param {HTMLSelectElement} select - District select element
     * @param {string} provinceCode - Province code
     * @param {string} cityCode - City code
     */
    async loadDistricts(select, provinceCode, cityCode) {
        try {
            const response = await fetch(`/api/regions/districts?province=${provinceCode}&city=${cityCode}`);
            const districts = await response.json();
            
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district.code;
                option.textContent = district.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load districts:', error);
        }
    }
}

// Export validator
export { FormValidator };
