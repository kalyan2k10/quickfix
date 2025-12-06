import React, { useState, useEffect } from 'react';
import './UserDashboard.css';
import { availableRequestTypes, UserActivityStatus } from './constants';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'; // Google Maps for all map views

// A simple component for a loading spinner
const Spinner = () => <div className="spinner"></div>;

const UserDashboard = ({ newRequest, onInputChange, onRequestSubmit, vendorsWithDistances, userLocation, activeRequest, setActiveRequest, authHeaders, onCompleteRequest, isLoaded, loadError }) => {
  const [liveVendorLocation, setLiveVendorLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [directions, setDirections] = useState(null);
  const [vehicleBearing, setVehicleBearing] = useState(0);

  // Custom Google Maps Icons
  const userIcon = {
    url: 'https://maps.google.com/mapfiles/kml/shapes/man.png', // Human icon for the user
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };

  const vendorIcon = {
    url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png', // Car icon for the vendor
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };

  const workerIcon = {
    url: 'https://maps.google.com/mapfiles/kml/shapes/motorcycling.png', // Motorcycle icon for the worker
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };

  // Helper function to update user status
  const updateUserStatus = (status) => {
    // We need the user's ID. We can fetch it from the /me endpoint.
    fetch('/users/me', { headers: authHeaders })
      .then(res => res.json())
      .then(currentUser => {
        fetch(`/users/${currentUser.id}/status`, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status }),
        });
      })
      .catch(console.error);
  };


  // Polling effect to check request status
  useEffect(() => {
    if (activeRequest && activeRequest.status === 'OPEN') {
      const interval = setInterval(() => {
        fetch(`/requests/${activeRequest.id}`, { headers: authHeaders })
          .then(res => res.json())
          .then(updatedRequest => {
            // Always update the active request to reflect the latest data from the server.
            // This is crucial for showing re-routing to a new intendedVendor.
            setActiveRequest(updatedRequest);

            if (updatedRequest.status !== 'OPEN') {
              // When vendor accepts, user state becomes ASSIGNED
              if (updatedRequest.status === 'ASSIGNED') {
                updateUserStatus(UserActivityStatus.ASSIGNED);
              }
              clearInterval(interval);
            }
          })
          .catch(console.error);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [activeRequest, authHeaders, setActiveRequest]);

  // This single effect now handles all logic for the 'ASSIGNED' state.
  useEffect(() => {
    if (activeRequest?.status === 'ASSIGNED' && activeRequest.assignedVendor) {
      // 1. Set the initial vendor location immediately.
      const initialVendorLoc = { latitude: activeRequest.assignedVendor.latitude, longitude: activeRequest.assignedVendor.longitude };
      setLiveVendorLocation(initialVendorLoc);
      
      // 2. Start polling for live location updates.
      const vendorId = activeRequest.assignedVendor.id;
      const interval = setInterval(() => {
        fetch(`/users/${vendorId}`, { headers: authHeaders })
          .then(res => res.json())
          .then(vendorData => {
            if (vendorData.latitude && vendorData.longitude) {
              const newLoc = { latitude: vendorData.latitude, longitude: vendorData.longitude };

              // Calculate bearing for icon rotation
              setLiveVendorLocation(prevLoc => {
                if (prevLoc) {
                  if (!isLoaded || !window.google.maps.geometry) {
                    console.error("Google Maps geometry library not loaded yet.");
                    return newLoc; // Return new location without calculating bearing
                  }
                  const bearing = window.google.maps.geometry.spherical.computeHeading(
                    new window.google.maps.LatLng(prevLoc.latitude, prevLoc.longitude),
                    new window.google.maps.LatLng(newLoc.latitude, newLoc.longitude)
                  );
                  setVehicleBearing(bearing);
                }
                return newLoc;
              });
            }
          })
          .catch(console.error);
      }, 5000); // Poll every 5 seconds for live location
      
      // 3. Cleanup: Stop polling when the component unmounts or the request status changes.
      return () => clearInterval(interval);
    } else {
      // If request is no longer assigned, clear all tracking data.
      setLiveVendorLocation(null);
      setDirections(null);
      setRouteInfo(null);
    }
  }, [activeRequest, authHeaders]);

  // Ref for the map instance to control it programmatically
  const mapRef = React.useRef(null);

  useEffect(() => {
    // Trigger route calculation only when map is loaded and locations are valid
    if (isLoaded && mapRef.current && activeRequest?.status === 'ASSIGNED' && userLocation && liveVendorLocation) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(liveVendorLocation.latitude, liveVendorLocation.longitude),
          destination: new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            // Update routeInfo directly from the Google Directions result.
            const leg = result.routes[0].legs[0];
            setRouteInfo({
              totalTime: leg.duration.value,
              totalDistance: leg.distance.value,
            });
          } else {
            console.error(`error fetching directions ${result}`);
            // Clear route info on error to prevent displaying stale data.
            setDirections(null);
            setRouteInfo(null);
          }
        }
      );
    }
  }, [isLoaded, activeRequest?.status, userLocation, liveVendorLocation]);

  if (!userLocation) {
    return <div className="form-card"><h2>Fetching your location to find nearby vendors...</h2></div>;
  }

  const mapCenter = userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore if no location

  // == STATE 3: Vendor Assigned, Live Tracking ==
  if (activeRequest && activeRequest.status === 'ASSIGNED') {
    const assignedWorker = activeRequest.assignedWorker;
    const assignedVendor = activeRequest.assignedVendor; // The vendor who employs the worker
    const userPosition = [userLocation.latitude, userLocation.longitude];
    // Use liveVendorLocation if available, otherwise fall back to the initial location.
    // We track the worker's location, so we use assignedWorker here.
    const currentVendorPosition = liveVendorLocation 
      ? [liveVendorLocation.latitude, liveVendorLocation.longitude]
      : [assignedWorker.latitude, assignedWorker.longitude];

    return (
      <>
        <div className="form-card">
          <h2>Vendor on the way!</h2>
          <p>
            <strong>{assignedWorker.name || assignedWorker.username}</strong> from <strong>{assignedVendor.name || assignedVendor.username}</strong> has taken up your task and is en route.
          </p>
          {routeInfo && (
            <div className="eta-info">
              <p>
                Estimated Arrival: <strong>{Math.round(routeInfo.totalTime / 60)} mins</strong>
              </p>
              <p>Distance: <strong>{(routeInfo.totalDistance / 1000).toFixed(2)} km</strong></p>
            </div>
          )}
          <div className="request-actions">
            <button className="action-button primary" onClick={() => {
              // The backend now handles all status updates for user and worker.
              onCompleteRequest(activeRequest.id);
            }}>Mark as Complete &amp; Pay</button>
          </div>
        </div>
        <div className="user-list-section">
          <h2>Live Tracking</h2>
          {loadError && <div>Error loading maps</div>}
          {!isLoaded && <div>Loading Map...</div>}
          {isLoaded && (
            <div className="map-view">
              <GoogleMap
                mapContainerClassName="map-view-container" // Ensure this class gives the map a height
                center={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                zoom={13}
                onLoad={map => { mapRef.current = map; }} // Store map instance on load
              >
                {/* User's Marker */}
                <Marker
                  position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                  title="Your Location"
                  icon={userIcon}
                />
                {/* Vendor's Marker */}
                <Marker
                  position={{ lat: currentVendorPosition[0], lng: currentVendorPosition[1] }}
                  title={`Worker: ${assignedWorker.username}`}
                  icon={workerIcon}
                />
                {/* Directions/Route */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{ suppressMarkers: true, preserveViewport: true }} // Markers are handled above
                  />
                )}
              </GoogleMap>
            </div>
          )}
        </div>
      </>
    );
  }

  // == STATE 2: Waiting for Vendor Confirmation ==
  if (activeRequest && activeRequest.status === 'OPEN') {
    return (
      <div className="form-card">
        <h2>Waiting for Vendor Confirmation</h2>
        <p>Your request for "<strong>{activeRequest.problemDescription}</strong>" has been sent.</p>
        <p>We are finding a nearby vendor for you...</p>
        <Spinner />
        <p><em>You will be automatically updated once a vendor accepts.</em></p>
      </div>
    );
  }


  // == STATE 4: Request Completed ==
  if (activeRequest && activeRequest.status === 'COMPLETED') {
    return (
      <div className="form-card">
        <h2>Service Completed!</h2>
        <p>
          Your request for "<strong>{activeRequest.problemDescription}</strong>" has been marked as complete by{" "}
          <strong>{activeRequest.assignedVendor?.username}</strong>.
        </p>
        <button className="action-button primary" onClick={() => setActiveRequest(null)}>Okay</button>
      </div>
    );
  }

  // == STATE 1: Initial Booking Screen ==
  return (
    <>
      <div className="form-card">
        <h2>Request Assistance
          <button onClick={() => updateUserStatus(UserActivityStatus.IDLE)} style={{fontSize: '0.6rem', marginLeft: '1rem', cursor: 'pointer'}}>
            Reset to Idle
          </button>
        </h2>
        <p>Let's get you back on the road. Please provide a few details.</p>
        <form onSubmit={(e) => { e.preventDefault(); onRequestSubmit(); }}>
            <select name="problemDescription" value={newRequest.problemDescription} onChange={onInputChange} className="form-input" required>
                <option value="" disabled>Select service type...</option> 
                {availableRequestTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
                <option value="Other">Other Issue</option>
            </select>
            <input
                className="form-input"
                type="text" name="vehicleNumber"
                placeholder="Vehicle Number (e.g., KA-01-AB-1234)"
                value={newRequest.vehicleNumber} onChange={onInputChange} required />
            <input
                className="form-input"
                type="text" name="name"
                placeholder="Your Name"
                value={newRequest.name} onChange={onInputChange} required />
            <input
                className="form-input"
                type="email" name="email"
                placeholder="Your Email"
                value={newRequest.email} onChange={onInputChange} required />
            <input
                className="form-input"
                type="tel" name="phoneNumber"
                placeholder="Your Phone Number"
                value={newRequest.phoneNumber} onChange={onInputChange} required />
            
            {newRequest.problemDescription === 'Other' && (
              <input className="form-input" type="text" name="otherProblem" placeholder="Please describe the issue" value={newRequest.otherProblem} onChange={onInputChange} required />
            )}

            <button type="submit" disabled={!newRequest.problemDescription} className="broadcast-button" onClick={() => {
              // When user raises request, state becomes WAITING
              // Note: This happens optimistically. The actual submission is handled by the form's onSubmit.
              updateUserStatus(UserActivityStatus.WAITING);
            }}>
                Find Help Now
            </button>
        </form>
      </div>

      <div className="user-list-section">
        <h2>Nearby Vendors</h2>
        {loadError && <div>Error loading maps</div>}
        {!isLoaded && <div>Loading Map...</div>}
        {isLoaded && (
          <>
            {!newRequest.problemDescription && (
              <div className="map-overlay-message">Please select a service to see nearby vendors.</div>
            )}
            <div className="map-view">
                <GoogleMap
                  mapContainerClassName="map-view-container"
                  center={mapCenter}
                  zoom={12}
                >
                  {/* User's Location */}
                  <Marker position={mapCenter} icon={userIcon} title="You are here" />

                  {/* Nearby Vendor Locations */}
                  {vendorsWithDistances.map(vendor => (
                    vendor.latitude && vendor.longitude && (
                      <Marker 
                        key={vendor.id} 
                        position={{ lat: vendor.latitude, lng: vendor.longitude }} 
                        icon={vendorIcon}
                        title={`${vendor.username} (${vendor.distance.toFixed(2)} km away)`}
                      />
                    )
                  ))}
                </GoogleMap>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UserDashboard;