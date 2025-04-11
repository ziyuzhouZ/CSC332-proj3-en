/**
 * Location Service Module Usage Example
 * Demonstrates how to integrate geolocation features into website pages
 */

import LocationService from '../location.js';
import ScreenUtils from '../screen.js';

// Initialize services
const location = LocationService.init();
const screen = ScreenUtils.init();

/**
 * Initialize store locator functionality
 * @param {string} containerId Container ID
 * @param {Object} options Configuration options
 */
function initStoreLocator(containerId = 'store-locator', options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Store locator container not found');
    return;
  }
  
  // Create necessary DOM structure
  setupLocatorUI(container);
  
  // Load all store data
  loadStoreList();
  
  // Try to get user location and update nearest store
  tryGetUserLocation();
  
  // Bind event handlers
  bindEvents();
  
  console.log('Store locator initialized');
}

/**
 * Set up locator UI structure
 * @param {HTMLElement} container Container element
 */
function setupLocatorUI(container) {
  container.innerHTML = `
    <div class="store-locator">
      <div class="location-consent">
        <div class="consent-message">
          <p>To recommend the nearest store to you, we need to access your location information.</p>
          <p class="privacy-note">Your location information will only be used for store recommendations and will not be used for any other purposes.</p>
        </div>
        <div class="consent-actions">
          <button id="allow-location" class="btn btn-primary">Allow Location Access</button>
          <button id="deny-location" class="btn btn-secondary">Not Now</button>
        </div>
      </div>
      
      <div class="location-status" style="display: none;">
        <div class="current-location">
          <span class="location-icon">📍</span>
          <span id="location-display">Location not obtained</span>
          <span id="location-source" class="source-tag"></span>
        </div>
        <button id="update-location" class="btn btn-sm">Update Location</button>
      </div>
      
      <div class="manual-location" style="display: none;">
        <h4>Set Location Manually</h4>
        <div class="input-group">
          <input type="text" id="manual-address" placeholder="City or address" class="form-control">
          <button id="search-address" class="btn btn-primary">Search</button>
        </div>
      </div>
      
      <div class="nearest-store" style="display: none;">
        <h3>Nearest Store</h3>
        <div id="nearest-store-details" class="store-card"></div>
      </div>
      
      <div class="store-list">
        <h3>All Stores</h3>
        <div id="stores-container"></div>
      </div>
    </div>
  `;
}

/**
 * Bind event handlers
 */
function bindEvents() {
  // Allow location access
  const allowBtn = document.getElementById('allow-location');
  if (allowBtn) {
    allowBtn.addEventListener('click', () => {
      location.setLocationConsent(true);
      
      // Update UI display
      document.querySelector('.location-consent').style.display = 'none';
      document.querySelector('.location-status').style.display = 'block';
      
      // Try to get location
      tryGetUserLocation();
    });
  }
  
  // Deny location access
  const denyBtn = document.getElementById('deny-location');
  if (denyBtn) {
    denyBtn.addEventListener('click', () => {
      location.setLocationConsent(false);
      
      // Update UI display
      document.querySelector('.location-consent').style.display = 'none';
      document.querySelector('.manual-location').style.display = 'block';
      document.querySelector('.location-status').style.display = 'block';
      document.getElementById('location-display').textContent = 'Please set location manually';
    });
  }
  
  // Update location button
  const updateBtn = document.getElementById('update-location');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      tryGetUserLocation(true);
    });
  }
  
  // Address search button
  const searchBtn = document.getElementById('search-address');
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      const address = document.getElementById('manual-address').value.trim();
      if (!address) {
        alert('Please enter a valid address');
        return;
      }
      
      try {
        await searchAddress(address);
      } catch (error) {
        console.error('Address search failed', error);
        alert('Could not find location information for this address, please try another address');
      }
    });
  }
  
  // Respond to screen size changes, adjust layout
  screen.onResize(() => {
    adjustLocatorLayout();
  });
}

/**
 * Try to get user location
 * @param {boolean} force Whether to force refresh
 */
async function tryGetUserLocation(force = false) {
  // Check if location access permission exists
  const hasConsent = location.getLocationConsent();
  
  // If not consented, show consent dialog
  if (!hasConsent) {
    document.querySelector('.location-consent').style.display = 'block';
    return;
  }
  
  // Show location status area
  document.querySelector('.location-status').style.display = 'block';
  document.querySelector('.location-consent').style.display = 'none';
  
  // Update location status display
  const locationDisplay = document.getElementById('location-display');
  const locationSource = document.getElementById('location-source');
  
  try {
    // Show loading state
    locationDisplay.textContent = 'Getting location...';
    
    // Get user coordinates
    let coordinates;
    
    if (force) {
      // Force refresh location
      coordinates = await location.requestLocationPermission();
    } else {
      // Try to get existing location or new location
      coordinates = await location.getUserCoordinates().catch(() => 
        location.requestLocationPermission()
      );
    }
    
    // Update location display
    locationDisplay.textContent = formatLocationDisplay(coordinates);
    
    // Show location source
    const status = location.getUserLocationStatus();
    if (status.source === 'gps') {
      locationSource.textContent = 'GPS';
      locationSource.className = 'source-tag source-gps';
    } else if (status.source === 'ip') {
      locationSource.textContent = 'IP Location';
      locationSource.className = 'source-tag source-ip';
    } else if (status.source === 'manual') {
      locationSource.textContent = 'Manual';
      locationSource.className = 'source-tag source-manual';
    }
    
    // Update nearest store display
    updateNearestStore(coordinates);
    
    // Update store list sorting
    sortStoresByDistance(coordinates);
    
  } catch (error) {
    console.error('Failed to get location', error);
    
    // Show error state
    locationDisplay.textContent = 'Failed to get location';
    
    // Show manual location input
    document.querySelector('.manual-location').style.display = 'block';
  }
}

/**
 * Format location display information
 * @param {Object} coordinates Coordinate object
 * @returns {string} Formatted location display
 */
function formatLocationDisplay(coordinates) {
  if (coordinates.locationName) {
    return coordinates.locationName;
  }
  
  // If no name, display coordinates (keep 3 decimal places)
  const lat = parseFloat(coordinates.lat).toFixed(3);
  const lng = parseFloat(coordinates.lng).toFixed(3);
  return `Location: ${lat}, ${lng}`;
}

/**
 * Load store list
 */
function loadStoreList() {
  const storesContainer = document.getElementById('stores-container');
  if (!storesContainer) return;
  
  const stores = location.getAllStores();
  
  stores.forEach(store => {
    const storeCard = createStoreCard(store);
    storesContainer.appendChild(storeCard);
  });
}

/**
 * Create store card element
 * @param {Object} store Store data
 * @param {number|null} distance Distance to store
 * @returns {HTMLElement} Store card element
 */
function createStoreCard(store, distance = null) {
  const card = document.createElement('div');
  card.className = 'store-card';
  card.dataset.id = store.id;
  
  let distanceText = '';
  if (distance !== null) {
    distanceText = `<div class="store-distance">${distance.toFixed(1)} km away</div>`;
  }
  
  card.innerHTML = `
    <div class="store-info">
      <h4 class="store-name">${store.name}</h4>
      <p class="store-address">${store.address}</p>
      <p class="store-hours">${store.businessHours}</p>
      ${distanceText}
    </div>
    <div class="store-actions">
      <button class="btn btn-sm btn-primary view-details">View Details</button>
      <button class="btn btn-sm btn-secondary get-directions">Get Directions</button>
    </div>
  `;
  
  return card;
}

/**
 * Update nearest store display
 * @param {Object} coordinates User coordinates
 */
function updateNearestStore(coordinates) {
  const nearestStore = location.findNearestStore(coordinates);
  if (!nearestStore) return;
  
  const container = document.querySelector('.nearest-store');
  const detailsContainer = document.getElementById('nearest-store-details');
  
  if (container && detailsContainer) {
    container.style.display = 'block';
    detailsContainer.innerHTML = createStoreCard(nearestStore, nearestStore.distance).innerHTML;
  }
}

/**
 * Sort stores by distance
 * @param {Object} coordinates User coordinates
 */
function sortStoresByDistance(coordinates) {
  const storesContainer = document.getElementById('stores-container');
  if (!storesContainer) return;
  
  const stores = location.getAllStores();
  const sortedStores = stores.sort((a, b) => {
    const distanceA = location.calculateDistance(coordinates, a.coordinates);
    const distanceB = location.calculateDistance(coordinates, b.coordinates);
    return distanceA - distanceB;
  });
  
  storesContainer.innerHTML = '';
  sortedStores.forEach(store => {
    const distance = location.calculateDistance(coordinates, store.coordinates);
    const storeCard = createStoreCard(store, distance);
    storesContainer.appendChild(storeCard);
  });
}

/**
 * Search address
 * @param {string} address Address to search
 */
async function searchAddress(address) {
  try {
    const coordinates = await location.geocodeAddress(address);
    if (coordinates) {
      // Update location display
      document.getElementById('location-display').textContent = formatLocationDisplay(coordinates);
      
      // Update nearest store
      updateNearestStore(coordinates);
      
      // Update store list sorting
      sortStoresByDistance(coordinates);
      
      // Hide manual location input
      document.querySelector('.manual-location').style.display = 'none';
    }
  } catch (error) {
    throw new Error('Address search failed');
  }
}

/**
 * Adjust locator layout based on screen size
 */
function adjustLocatorLayout() {
  const container = document.querySelector('.store-locator');
  if (!container) return;
  
  const { width } = screen.getScreenState();
  
  if (width < 768) {
    // Mobile layout
    container.classList.add('mobile-layout');
    container.classList.remove('desktop-layout');
  } else {
    // Desktop layout
    container.classList.remove('mobile-layout');
    container.classList.add('desktop-layout');
  }
}

// Export functionality for other modules
export {
  initStoreLocator,
  tryGetUserLocation,
  updateNearestStore
}; 