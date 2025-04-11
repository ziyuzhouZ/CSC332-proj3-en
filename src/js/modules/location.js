/**
 * Location Service Module
 * Provides user location acquisition and nearest store recommendation functionality
 */

// Import screen utility for responsive interface adjustments
import ScreenUtils from './screen.js';

// Storage key name
const STORAGE_KEY = 'user_location_preferences';

// Earth radius (in kilometers)
const EARTH_RADIUS_KM = 6371;

// Privacy consent status
const consentStatus = {
  locationTracking: false,
  lastUpdated: null
};

// User location information
const userLocation = {
  lat: null,
  lng: null,
  accuracy: null,
  source: null, // 'gps', 'ip', 'manual'
  timestamp: null
};

// Store data
const stores = [
  {
    id: 1,
    name: "Hanes Mall Branch",
    address: "3320 Silas Creek Pkwy, Winston-Salem, NC 27103",
    lat: 36.063882,
    lng: -80.331560,
    openingHours: "Monday to Saturday 10:00-20:00",
    contact: "(336) 555-0101"
  },
  {
    id: 2,
    name: "University District Branch",
    address: "1834 Wake Forest Rd, Winston-Salem, NC 27109",
    lat: 36.133661,
    lng: -80.275294,
    openingHours: "Monday to Friday 9:00-17:00",
    contact: "(336) 555-0202"
  },
  {
    id: 3,
    name: "Downtown Branch",
    address: "455 Vine St, Winston-Salem, NC 27101",
    lat: 36.097179,
    lng: -80.244566,
    openingHours: "Monday to Friday 10:00-18:00, Saturday 10:00-16:00",
    contact: "(336) 555-0303"
  }
];

/**
 * Initialize location service
 * @param {Object} options Optional configuration parameters
 * @returns {Object} Location service API
 */
function init(options = {}) {
  // Load user location preferences from local storage
  loadUserPreferences();
  
  // Load privacy consent status
  loadConsentStatus();
  
  // Check if automatic location is allowed
  if (consentStatus.locationTracking) {
    // Attempt to get user location
    getUserLocation();
  }
  
  console.log('Location service initialized');
  
  // Return public API
  return {
    requestLocationPermission,
    getUserCoordinates,
    getAllStores,
    findNearestStore,
    getStoresByDistance,
    calculateDistance,
    setManualLocation,
    getLocationConsent,
    setLocationConsent,
    getUserLocationStatus
  };
}

/**
 * Request location permission and get user location
 * @returns {Promise<Object>} User location
 */
function requestLocationPermission() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser does not support geolocation"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Update user location
        userLocation.lat = position.coords.latitude;
        userLocation.lng = position.coords.longitude;
        userLocation.accuracy = position.coords.accuracy;
        userLocation.source = 'gps';
        userLocation.timestamp = Date.now();
        
        // Update privacy consent status
        consentStatus.locationTracking = true;
        consentStatus.lastUpdated = Date.now();
        
        // Save to local storage
        saveUserPreferences();
        saveConsentStatus();
        
        console.log('User GPS location obtained', userLocation);
        resolve(userLocation);
      },
      async (error) => {
        console.warn('GPS location failed, attempting IP location', error);
        
        // Fallback to IP location
        try {
          const ipLocation = await getLocationByIP();
          resolve(ipLocation);
        } catch (ipError) {
          console.error('IP location also failed, manual location input required', ipError);
          reject(new Error('Location acquisition failed, please enter your location manually'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  });
}

/**
 * Get approximate location via IP address
 * @returns {Promise<Object>} User location
 */
async function getLocationByIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`IP location API response error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update user location
    userLocation.lat = data.latitude;
    userLocation.lng = data.longitude;
    userLocation.accuracy = 10000; // IP location has lower accuracy, about 10km
    userLocation.source = 'ip';
    userLocation.timestamp = Date.now();
    
    // Save to local storage
    saveUserPreferences();
    
    console.log('User IP location obtained', userLocation);
    return userLocation;
  } catch (error) {
    console.error('IP location request failed', error);
    throw error;
  }
}

/**
 * Get user's current coordinates
 * @returns {Promise<Object>} User coordinates
 */
async function getUserCoordinates() {
  // If user location data exists and is not older than 30 minutes, return directly
  if (userLocation.lat && userLocation.lng && 
      userLocation.timestamp && 
      (Date.now() - userLocation.timestamp < 30 * 60 * 1000)) {
    return { lat: userLocation.lat, lng: userLocation.lng };
  }
  
  // Otherwise get new location
  if (consentStatus.locationTracking) {
    try {
      await requestLocationPermission();
      return { lat: userLocation.lat, lng: userLocation.lng };
    } catch (error) {
      console.error('Failed to get user coordinates', error);
      throw error;
    }
  } else {
    throw new Error('User has not granted location access permission');
  }
}

/**
 * Set user's manually entered location
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {string} locationName Location name (optional)
 */
function setManualLocation(lat, lng, locationName = '') {
  if (typeof lat !== 'number' || typeof lng !== 'number' ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Invalid coordinate values');
  }
  
  userLocation.lat = lat;
  userLocation.lng = lng;
  userLocation.accuracy = null;
  userLocation.source = 'manual';
  userLocation.timestamp = Date.now();
  userLocation.locationName = locationName;
  
  // Save to local storage
  saveUserPreferences();
  
  console.log('Manual location set', userLocation);
  return userLocation;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 First point latitude
 * @param {number} lng1 First point longitude
 * @param {number} lat2 Second point latitude
 * @param {number} lng2 Second point longitude
 * @returns {number} Distance (in kilometers)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Convert to radians
  const toRad = (value) => value * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Get all stores
 * @returns {Array} List of all stores
 */
function getAllStores() {
  return [...stores];
}

/**
 * Find the nearest store to the given coordinates
 * @param {Object} coordinates Optional coordinates to search from
 * @returns {Object} Nearest store
 */
async function findNearestStore(coordinates = null) {
  try {
    // If no coordinates provided, use user's current location
    if (!coordinates) {
      coordinates = await getUserCoordinates();
    }
    
    let nearestStore = null;
    let minDistance = Infinity;
    
    // Find the store with minimum distance
    stores.forEach(store => {
      const distance = calculateDistance(
        coordinates.lat,
        coordinates.lng,
        store.lat,
        store.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = { ...store, distance };
      }
    });
    
    return nearestStore;
  } catch (error) {
    console.error('Failed to find nearest store', error);
    throw error;
  }
}

/**
 * Get stores sorted by distance
 * @param {Object} coordinates Optional coordinates to calculate distance from
 * @returns {Array} Stores sorted by distance
 */
async function getStoresByDistance(coordinates = null) {
  try {
    // If no coordinates provided, use user's current location
    if (!coordinates) {
      coordinates = await getUserCoordinates();
    }
    
    // Calculate distance for each store
    const storesWithDistance = stores.map(store => ({
      ...store,
      distance: calculateDistance(
        coordinates.lat,
        coordinates.lng,
        store.lat,
        store.lng
      )
    }));
    
    // Sort by distance
    return storesWithDistance.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Failed to get stores by distance', error);
    throw error;
  }
}

/**
 * Get location consent status
 * @returns {Object} Consent status
 */
function getLocationConsent() {
  return { ...consentStatus };
}

/**
 * Set location consent status
 * @param {boolean} consent Whether to allow location tracking
 */
function setLocationConsent(consent) {
  if (typeof consent !== 'boolean') {
    throw new Error('Consent must be a boolean value');
  }
  
  consentStatus.locationTracking = consent;
  consentStatus.lastUpdated = Date.now();
  
  // Save to local storage
  saveConsentStatus();
  
  // If consent granted, try to get location
  if (consent) {
    getUserLocation();
  }
  
  return consentStatus;
}

/**
 * Get user location
 * @returns {Object} User location
 */
function getUserLocation() {
  return { ...userLocation };
}

/**
 * Get user location status
 * @returns {Object} Location status
 */
function getUserLocationStatus() {
  return {
    hasLocation: !!userLocation.lat && !!userLocation.lng,
    source: userLocation.source,
    accuracy: userLocation.accuracy,
    timestamp: userLocation.timestamp,
    consent: consentStatus.locationTracking
  };
}

/**
 * Save user preferences to local storage
 */
function saveUserPreferences() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userLocation));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

/**
 * Load user preferences from local storage
 */
function loadUserPreferences() {
  try {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);
    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences);
      Object.assign(userLocation, parsed);
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
}

/**
 * Save consent status to local storage
 */
function saveConsentStatus() {
  try {
    localStorage.setItem('location_consent', JSON.stringify(consentStatus));
  } catch (error) {
    console.error('Failed to save consent status:', error);
  }
}

/**
 * Load consent status from local storage
 */
function loadConsentStatus() {
  try {
    const savedConsent = localStorage.getItem('location_consent');
    if (savedConsent) {
      const parsed = JSON.parse(savedConsent);
      Object.assign(consentStatus, parsed);
    }
  } catch (error) {
    console.error('Failed to load consent status:', error);
  }
}

/**
 * Initialize store data
 */
function initializeStoreData() {
  // This function can be used to load store data from an API or database
  // Currently using static data
}

// Export module
export default {
  init,
  requestLocationPermission,
  getUserCoordinates,
  getAllStores,
  findNearestStore,
  getStoresByDistance,
  calculateDistance,
  setManualLocation,
  getLocationConsent,
  setLocationConsent,
  getUserLocationStatus
}; 