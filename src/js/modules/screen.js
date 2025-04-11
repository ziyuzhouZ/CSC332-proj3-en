/**
 * Responsive Screen Utility Module
 * Provides screen size change monitoring, orientation detection, and related event handling
 */

// Data structure for storing screen state
const screenState = {
  width: window.innerWidth,
  height: window.innerHeight,
  orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  breakpoints: {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1600
  }
};

// Event listener storage
const eventListeners = {
  resize: [],
  orientationChange: []
};

// Local storage key name
const STORAGE_KEY = 'screen_preferences';

/**
 * Initialize screen monitoring
 * @param {Object} options Optional configuration
 */
function init(options = {}) {
  // Merge user-provided breakpoint settings
  if (options.breakpoints) {
    screenState.breakpoints = {
      ...screenState.breakpoints,
      ...options.breakpoints
    };
  }

  // Load user preferences from local storage
  loadPreferences();
  
  // Set up event listeners
  setupEventListeners();
  
  // Trigger an immediate update after initialization
  updateScreenState();
  
  console.log('Screen responsive utility initialized', screenState);
  
  return {
    getScreenState,
    getCurrentBreakpoint,
    isBreakpoint,
    onResize,
    onOrientationChange,
    savePreference,
    removeEventListener
  };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Debounce function implementation
  let resizeTimeout;
  
  // Listen for window resize events
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateScreenState();
    }, 100); // 100ms debounce interval
  });
  
  // Listen for device orientation change events
  window.addEventListener('orientationchange', () => {
    updateScreenState();
  });
}

/**
 * Update screen state and trigger corresponding events
 */
function updateScreenState() {
  const prevState = { ...screenState };
  
  // Update dimensions
  screenState.width = window.innerWidth;
  screenState.height = window.innerHeight;
  
  // Update orientation
  const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  const orientationChanged = screenState.orientation !== newOrientation;
  screenState.orientation = newOrientation;
  
  // Trigger resize events
  eventListeners.resize.forEach(callback => {
    try {
      callback(screenState);
    } catch (error) {
      console.error('Screen size change event callback execution error:', error);
    }
  });
  
  // If orientation changed, trigger orientationChange events
  if (orientationChanged) {
    eventListeners.orientationChange.forEach(callback => {
      try {
        callback(screenState);
      } catch (error) {
        console.error('Screen orientation change event callback execution error:', error);
      }
    });
  }
}

/**
 * Get current screen state
 * @returns {Object} Current screen state
 */
function getScreenState() {
  return { ...screenState };
}

/**
 * Get current matching breakpoint
 * @returns {string} Breakpoint name (xs, sm, md, lg, xl)
 */
function getCurrentBreakpoint() {
  const { width, breakpoints } = screenState;
  
  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'sm';
  if (width < breakpoints.md) return 'md';
  if (width < breakpoints.lg) return 'lg';
  if (width < breakpoints.xl) return 'xl';
  return 'xxl';
}

/**
 * Check if current screen matches specified breakpoint
 * @param {string} breakpoint Breakpoint name
 * @returns {boolean} Whether it matches
 */
function isBreakpoint(breakpoint) {
  return getCurrentBreakpoint() === breakpoint;
}

/**
 * Register screen size change callback
 * @param {Function} callback Callback function
 * @returns {string} Event ID for removing listener
 */
function onResize(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  const eventId = generateEventId();
  eventListeners.resize.push(callback);
  return eventId;
}

/**
 * Register screen orientation change callback
 * @param {Function} callback Callback function
 * @returns {string} Event ID for removing listener
 */
function onOrientationChange(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  const eventId = generateEventId();
  eventListeners.orientationChange.push(callback);
  return eventId;
}

/**
 * Remove event listener
 * @param {string} eventType Event type ('resize' or 'orientationChange')
 * @param {Function} callback Callback function to remove
 */
function removeEventListener(eventType, callback) {
  if (!eventListeners[eventType]) {
    return;
  }
  
  const index = eventListeners[eventType].indexOf(callback);
  if (index !== -1) {
    eventListeners[eventType].splice(index, 1);
  }
}

/**
 * Generate unique event ID
 * @returns {string} Unique ID
 */
function generateEventId() {
  return `screen_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save user screen preferences to local storage
 * @param {string} key Preference key
 * @param {*} value Preference value
 */
function savePreference(key, value) {
  try {
    const preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    preferences[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Failed to save screen preferences:', error);
    return false;
  }
}

/**
 * Load user preferences from local storage
 */
function loadPreferences() {
  try {
    const preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Apply saved preferences
    if (preferences.breakpoints) {
      screenState.breakpoints = {
        ...screenState.breakpoints,
        ...preferences.breakpoints
      };
    }
  } catch (error) {
    console.error('Failed to load screen preferences:', error);
  }
}

// Export module
export default {
  init,
  getScreenState,
  getCurrentBreakpoint,
  isBreakpoint,
  onResize,
  onOrientationChange,
  savePreference
}; 