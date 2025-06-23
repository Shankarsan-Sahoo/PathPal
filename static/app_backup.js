// Global variables
let map;
let directionsService;
let directionsRenderer;
let autocomplete;
let currentPosition = null;
let currentRoute = null;
let currentLocationMarker = null;
let currentRoutePolyline = null;
let destinationMarker = null;
let locationWatchId = null; // Add this to track location watcher

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof google !== 'undefined' && google.maps) {
        initializeApp();
    } else {
        window.initMap = initializeApp;
    }
});

// Main initialization
function initializeApp() {
    console.log('=== PATHPAL INITIALIZATION ===');
    initializeMap();
    initializeAutocomplete();
    setupEventListeners();
    
    // Get fresh location immediately
    getFreshLocation();
}

// Initialize Google Maps
function initializeMap() {
    console.log('Initializing map...');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found!');
        return;
    }
    
    // Default to Hyderabad
    const defaultLocation = { lat: 17.3850, lng: 78.4867 };
    
    map = new google.maps.Map(mapElement, {
        center: defaultLocation,
        zoom: 15,
        styles: getDarkMapStyle(),
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 8,
            strokeOpacity: 1.0,
            zIndex: 1000
        }
    });
    
    console.log('Map initialized successfully');
}

// Get FRESH location - no caching, no complications
function getFreshLocation() {
    console.log('=== GETTING FRESH LOCATION ===');
    
    // Clear any existing location
    currentPosition = null;
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
        currentLocationMarker = null;
    }
    
    // Clear chat window
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.innerHTML = '<div class="text-gray-400 text-sm text-center">Getting your location...</div>';
    }
    
    if (!navigator.geolocation) {
        showMessage('Location not supported by your browser.', 'error');
        return;
    }
    
    console.log('Requesting fresh location...');
    
    // Force fresh location with strict options
    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0  // NO CACHING - force fresh location
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('✅ FRESH LOCATION OBTAINED!');
            console.log('Coordinates:', position.coords.latitude, position.coords.longitude);
            console.log('Accuracy:', position.coords.accuracy, 'meters');
            console.log('Timestamp:', new Date(position.timestamp));
            
            // Store fresh location
            currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update map
            if (map) {
                map.setCenter(currentPosition);
                map.setZoom(16);
            }
            
            // Add location marker
            currentLocationMarker = new google.maps.Marker({
                position: currentPosition,
                map: map,
                title: 'Your Location',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#3B82F6',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                }
            });
            
            // Update chat
            if (chatWindow) {
                chatWindow.innerHTML = '<div class="text-gray-400 text-sm text-center">Location detected! Enter a destination for walking directions.</div>';
            }
            
            showMessage('Location detected! You can now search for a destination.', 'success');
            console.log('=== LOCATION DETECTION COMPLETED ===');
        },
        function(error) {
            console.error('❌ Location error:', error);
            
            let errorMessage = 'Unable to get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Please allow location access in your browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'Unknown error occurred.';
            }
            
            showMessage(errorMessage, 'error');
            
            // Update chat
            if (chatWindow) {
                chatWindow.innerHTML = '<div class="text-gray-400 text-sm text-center">Location access needed. Please refresh and allow location access.</div>';
            }
        },
        options
    );
}

// Initialize autocomplete
function initializeAutocomplete() {
    const input = document.getElementById('destination-input');
    if (!input) return;
    
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'geometry', 'name', 'formatted_address']
    });
    
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        handlePlaceSelection(place);
    });
}

// Handle place selection
function handlePlaceSelection(place) {
    console.log('Place selected:', place);
    
    if (!place.geometry) {
        showMessage('No details available for the selected place.', 'error');
        return;
    }
    
    if (!currentPosition) {
        showMessage('Please allow location access first.', 'error');
        return;
    }
    
    // Clear previous route
    directionsRenderer.setDirections({ routes: [] });
    
    // Add destination marker
    if (destinationMarker) {
        destinationMarker.setMap(null);
    }
    
    destinationMarker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name || place.formatted_address,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
        }
    });
    
    // Clear chat history for new destination search, but keep initial location message
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.innerHTML = '<div class="text-gray-400 text-sm text-center">Location detected! Enter a destination for walking directions.</div>';
    }
    
    // Get directions
    getWalkingDirections(currentPosition, place.geometry.location, place.name || place.formatted_address);
}

// Get walking directions
function getWalkingDirections(origin, destination, destinationName) {
    console.log('Getting walking directions...');
    showLoading(true);
    
    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: true,
        provideRouteAlternatives: false,
        avoidHighways: true,
        avoidTolls: true
    };
    
    directionsService.route(request, function(result, status) {
        showLoading(false);
        
        if (status === 'OK') {
            console.log('Directions obtained successfully');
            
            // Render the route
            directionsRenderer.setDirections(result);
            
            // Extract route info
            const route = result.routes[0];
            const leg = route.legs[0];
            const steps = leg.steps.map(step => step.instructions);
            const distance = leg.distance.text;
            const duration = leg.duration.text;
            
            console.log('Route info:', { distance, duration, steps });
            
            // Get AI guide
            getAIGuide(destinationName, steps, distance, duration);
            
            // Fit map to show entire route
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            map.fitBounds(bounds);
            
        } else {
            console.error('Directions failed:', status);
            showMessage('Unable to get directions. Please try again.', 'error');
        }
    });
}

// Get AI guide
async function getAIGuide(destination, steps, distance, duration) {
    console.log('Getting AI guide...');
    
    try {
        const response = await fetch('/get_guide', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start: 'your current location',
                destination: destination,
                steps: steps,
                distance: distance,
                duration: duration
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayAIGuide(data.guide);
        } else {
            showMessage('Unable to generate guide. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error getting AI guide:', error);
        showMessage('Unable to generate guide. Please try again.', 'error');
    }
}

// Display AI guide
function displayAIGuide(guide) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
    // Don't clear previous messages - just add the new one
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fade-in';
    messageDiv.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
                    </svg>
                </div>
            </div>
            <div class="flex-1">
                <div class="chat-message rounded-lg p-3">
                    <p class="text-white text-sm whitespace-pre-wrap">${guide}</p>
                </div>
            </div>
        </div>
    `;
    
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Handle follow-up questions
async function handleFollowupQuestion() {
    const input = document.getElementById('followup-input');
    const question = input.value.trim();
    
    if (!question) return;
    
    // Add user message
    addUserMessage(question);
    input.value = '';
    
    try {
        // Get current destination from the destination marker
        let currentDestination = '';
        if (destinationMarker) {
            currentDestination = destinationMarker.getTitle() || 'the destination';
        }
        
        const response = await fetch('/ask_followup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                context: 'Current walking route',
                current_destination: currentDestination
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayAIGuide(data.answer);
        } else {
            showMessage('Unable to process question. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error handling followup:', error);
        showMessage('Unable to process question. Please try again.', 'error');
    }
}

// Add user message to chat
function addUserMessage(message) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fade-in';
    messageDiv.innerHTML = `
        <div class="flex items-start space-x-3 justify-end">
            <div class="flex-1">
                <div class="user-message rounded-lg p-3">
                    <p class="text-white text-sm">${message}</p>
                </div>
            </div>
            <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
            </div>
        </div>
    `;
    
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Setup event listeners
function setupEventListeners() {
    // Follow-up input
    const followupInput = document.getElementById('followup-input');
    const sendButton = document.getElementById('send-followup');
    
    if (followupInput) {
        followupInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleFollowupQuestion();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', handleFollowupQuestion);
    }
    
    // Page refresh - always get fresh location
    window.addEventListener('beforeunload', function() {
        // Clear any cached location data
        currentPosition = null;
    });
}

// Show/hide loading
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Show message
function showMessage(message, type = 'info') {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'fade-in';
    
    let bgColor = 'bg-gray-600';
    if (type === 'error') {
        bgColor = 'bg-red-600';
    } else if (type === 'success') {
        bgColor = 'bg-green-600';
    }
    
    messageDiv.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 ${bgColor} rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
            <div class="flex-1">
                <div class="chat-message rounded-lg p-3">
                    <p class="text-white text-sm">${message}</p>
                </div>
            </div>
        </div>
    `;
    
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Dark map style
function getDarkMapStyle() {
    return [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }]
        },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }]
        },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }]
        },
        {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
        },
        {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
        },
        {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }]
        },
        {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }]
        },
        {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
        },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }]
        },
        {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }]
        }
    ];
}

// Clear existing location marker
function clearCurrentLocationMarker() {
    if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
        currentLocationMarker = null;
    }
}

// Clear all route and location data
function clearAllRouteData() {
    // Clear route
    directionsRenderer.setDirections({ routes: [] });
    clearCurrentRoutePolyline();
    currentRoute = null;
    
    // Clear markers
    clearCurrentLocationMarker();
    clearDestinationMarker();
    
    // Clear chat window
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.innerHTML = '<div class="text-gray-400 text-sm text-center">Enter a destination to get friendly walking directions</div>';
    }
    
    console.log('All route data cleared');
}

// Clear existing route polyline
function clearCurrentRoutePolyline() {
    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
        currentRoutePolyline = null;
    }
}

// Clear existing destination marker
function clearDestinationMarker() {
    if (destinationMarker) {
        destinationMarker.setMap(null);
        destinationMarker = null;
    }
}

// Add destination marker
function addDestinationMarker(position, title) {
    clearDestinationMarker();
    
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        destinationMarker = new google.maps.marker.AdvancedMarkerElement({
            position: position,
            map: map,
            title: title,
            content: createMarkerContent('#EF4444') // Red color for destination
        });
    } else {
        destinationMarker = new google.maps.Marker({
            position: position,
            map: map,
            title: title,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
            }
        });
    }
    
    console.log('Destination marker added:', title);
}

// Create marker content for AdvancedMarkerElement
function createMarkerContent(color) {
    const div = document.createElement('div');
    div.innerHTML = `
        <div style="
            width: 16px;
            height: 16px;
            background-color: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
    `;
    return div;
}

// Manual route drawing fallback
function drawRouteManually(route) {
    clearCurrentRoutePolyline();
    
    console.log('Drawing route manually for route:', route);
    
    if (route && route.overview_path) {
        console.log('Route overview path points:', route.overview_path.length);
        
        // Create a more visible polyline
        currentRoutePolyline = new google.maps.Polyline({
            path: route.overview_path,
            geodesic: true,
            strokeColor: '#3B82F6', // Blue color
            strokeOpacity: 1.0, // Full opacity
            strokeWeight: 8, // Thicker line
            map: map,
            zIndex: 1000 // Ensure it's on top
        });
        
        console.log('Route drawn manually with polyline:', currentRoutePolyline);
        
        // Fit map to show the entire route
        if (route.bounds) {
            map.fitBounds(route.bounds);
            console.log('Map fitted to route bounds');
        }
        
        // Add some padding to the bounds
        setTimeout(() => {
            if (route.bounds) {
                map.fitBounds(route.bounds, {
                    padding: { top: 50, right: 50, bottom: 50, left: 50 }
                });
                console.log('Map fitted to route bounds with padding');
            }
        }, 500);
        
    } else {
        console.error('No overview path available for manual drawing');
        
        // Try to create a simple line between origin and destination
        if (currentPosition && destinationMarker) {
            const destinationPosition = destinationMarker.getPosition();
            if (destinationPosition) {
                console.log('Creating simple line between points');
                currentRoutePolyline = new google.maps.Polyline({
                    path: [currentPosition, destinationPosition],
                    geodesic: true,
                    strokeColor: '#3B82F6',
                    strokeOpacity: 1.0,
                    strokeWeight: 8,
                    map: map,
                    zIndex: 1000
                });
                console.log('Simple route line drawn:', currentRoutePolyline);
                
                // Fit map to show both points
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(currentPosition);
                bounds.extend(destinationPosition);
                map.fitBounds(bounds, {
                    padding: { top: 50, right: 50, bottom: 50, left: 50 }
                });
                console.log('Map fitted to simple route bounds');
            }
        }
    }
}

// Update debug information
function updateDebugInfo() {
    const mapStatus = document.getElementById('map-status');
    const locationStatus = document.getElementById('location-status');
    const coordinates = document.getElementById('coordinates');
    
    if (mapStatus) {
        mapStatus.textContent = map ? 'Loaded' : 'Not loaded';
        mapStatus.className = map ? 'text-green-400' : 'text-red-400';
    }
    
    if (locationStatus) {
        locationStatus.textContent = currentPosition ? 'Detected' : 'Not detected';
        locationStatus.className = currentPosition ? 'text-green-400' : 'text-red-400';
    }
    
    if (coordinates) {
        if (currentPosition) {
            coordinates.textContent = `${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`;
            coordinates.className = 'text-green-400';
        } else {
            coordinates.textContent = 'None';
            coordinates.className = 'text-red-400';
        }
    }
}

// Toggle debug info visibility
function toggleDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.classList.toggle('hidden');
        updateDebugInfo();
    }
}

// Simple location test function (can be called from browser console)
function testLocation() {
    console.log('=== LOCATION TEST STARTED ===');
    console.log('Testing basic location detection...');
    
    if (!navigator.geolocation) {
        console.error('Geolocation is not supported');
        return;
    }
    
    console.log('Geolocation is supported');
    console.log('Testing with basic options...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('✅ LOCATION TEST SUCCESS!');
            console.log('Latitude:', position.coords.latitude);
            console.log('Longitude:', position.coords.longitude);
            console.log('Accuracy:', position.coords.accuracy, 'meters');
            console.log('Timestamp:', new Date(position.timestamp));
            
            // Test if we can create a marker
            if (map) {
                console.log('✅ Map is available');
                const testPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Try to set map center
                map.setCenter(testPosition);
                console.log('✅ Map center set to:', testPosition);
                
                // Try to add a marker
                const testMarker = new google.maps.Marker({
                    position: testPosition,
                    map: map,
                    title: 'Test Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#FF0000',
                        fillOpacity: 1,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2
                    }
                });
                console.log('✅ Test marker added:', testMarker);
                
                showMessage('Location test successful! Red marker shows your location.', 'success');
            } else {
                console.error('❌ Map is not available');
                showMessage('Location works but map is not loaded!', 'error');
            }
        },
        function(error) {
            console.error('❌ LOCATION TEST FAILED');
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            let errorMsg = 'Location test failed: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Permission denied. Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Position unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Request timed out.';
                    break;
                default:
                    errorMsg += 'Unknown error.';
                    break;
            }
            
            showMessage(errorMsg, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Start watching for location changes
function startLocationWatching() {
    if (navigator.geolocation) {
        console.log('Starting location watching...');
        locationWatchId = navigator.geolocation.watchPosition(
            function(position) {
                console.log('Location watch update:', position.coords);
                
                // Check if this is a fresh location
                const timeDiff = Math.abs(position.timestamp - Date.now());
                if (timeDiff > 10000) { // Allow 10 seconds for watch updates
                    console.warn('⚠️ WARNING: Watch location might be cached! Time difference:', timeDiff, 'ms');
                    return; // Skip cached location
                }
                
                console.log('✅ Watch location is fresh! Time difference:', timeDiff, 'ms');
                
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: position.timestamp,
                    accuracy: position.coords.accuracy
                };
                
                // Update marker position if it exists
                if (currentLocationMarker) {
                    currentLocationMarker.setPosition(currentPosition);
                    console.log('Location marker updated to:', currentPosition);
                }
                
                updateDebugInfo();
            },
            function(error) {
                console.log('Location watch error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0 // Force fresh location
            }
        );
        console.log('Location watching started with ID:', locationWatchId);
    }
}

// Test route visibility (can be called from browser console)
function testRoute() {
    console.log('=== ROUTE TEST STARTED ===');
    
    if (!currentPosition) {
        console.error('No current position available');
        showMessage('Please get your location first', 'error');
        return;
    }
    
    if (!map) {
        console.error('Map not available');
        showMessage('Map not loaded', 'error');
        return;
    }
    
    // Test with a simple destination
    const testDestination = {
        lat: currentPosition.lat + 0.001, // Small offset
        lng: currentPosition.lng + 0.001
    };
    
    console.log('Testing route from:', currentPosition, 'to:', testDestination);
    
    // Draw a simple test line
    const testPolyline = new google.maps.Polyline({
        path: [currentPosition, testDestination],
        geodesic: true,
        strokeColor: '#FF0000', // Red for testing
        strokeOpacity: 1.0,
        strokeWeight: 10,
        map: map,
        zIndex: 2000
    });
    
    console.log('Test polyline created:', testPolyline);
    
    // Fit map to show the test route
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(currentPosition);
    bounds.extend(testDestination);
    map.fitBounds(bounds);
    
    showMessage('Test route drawn in red. Check if you can see it!', 'info');
    
    // Remove test route after 5 seconds
    setTimeout(() => {
        testPolyline.setMap(null);
        console.log('Test route removed');
    }, 5000);
}

// Make test functions available globally
window.testLocation = testLocation;
window.testRoute = testRoute;
window.clearAllLocationData = clearAllLocationData; 
window.clearAllLocationData = clearAllLocationData; 