import React, { useState, useEffect } from 'react';
import './UserDashboard.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, Tooltip } from 'react-leaflet'; // Leaflet for initial map
import L from 'leaflet';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api'; // Google Maps for tracking

// A simple component for a loading spinner
const Spinner = () => <div className="spinner"></div>;

const UserDashboard = ({ newRequest, onInputChange, onRequestSubmit, vendorsWithDistances, userLocation, activeRequest, setActiveRequest, authHeaders, nearestVendor, fare, distance, onCompleteRequest }) => {
  const [liveVendorLocation, setLiveVendorLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [directions, setDirections] = useState(null);
  const [vehicleBearing, setVehicleBearing] = useState(0);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDRDs9yP06U9Nj1L3IDoiEuOBlJiobl76o", // This key is compromised. Please replace it.
    libraries: ["places"],
  });


  // --- Icon setup ---
  // Fix for default marker icon issue with webpack
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });

  // Custom icons for user and vendors
  const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png', // Human icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  const vendorIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/619/619127.png', // Car icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [1, -34],
  });

  // Polling effect to check request status
  useEffect(() => {
    if (activeRequest && activeRequest.status === 'OPEN') {
      const interval = setInterval(() => {
        fetch(`/requests/${activeRequest.id}`, { headers: authHeaders })
          .then(res => res.json())
          .then(updatedRequest => {
            if (updatedRequest.status !== 'OPEN') {
              setActiveRequest(updatedRequest);
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
          } // Don't clear routeInfo on error, to avoid flickering.
        }
      );
    }
  }, [isLoaded, activeRequest?.status, userLocation, liveVendorLocation]);

  if (!userLocation) {
    return <div className="form-card"><h2>Fetching your location to find nearby vendors...</h2></div>;
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

  // == STATE 3: Vendor Assigned, Live Tracking ==
  if (activeRequest && activeRequest.status === 'ASSIGNED') {
    const assignedVendor = activeRequest.assignedVendor;
    const userPosition = [userLocation.latitude, userLocation.longitude];
    // Use liveVendorLocation if available, otherwise fall back to the initial location.
    const currentVendorPosition = liveVendorLocation 
      ? [liveVendorLocation.latitude, liveVendorLocation.longitude] 
      : [assignedVendor.latitude, assignedVendor.longitude];

    const mapCenter = {
      lat: userLocation.latitude,
      lng: userLocation.longitude
    };


    return (
      <>
        <div className="form-card">
          <h2>Vendor on the way!</h2>
          <p><strong>{assignedVendor.username}</strong> has accepted your request and is en route.</p>
          {routeInfo && (
            <div className="eta-info">
              <p>
                Estimated Arrival: <strong>{Math.round(routeInfo.totalTime / 60)} mins</strong>
              </p>
              <p>Distance: <strong>{(routeInfo.totalDistance / 1000).toFixed(2)} km</strong></p>
            </div>
          )}
          <div className="request-actions">
            <button className="complete" onClick={() => onCompleteRequest(activeRequest.id)}>Mark as Complete & Pay</button>
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
                center={mapCenter}
                zoom={13}
                onLoad={map => { mapRef.current = map; }} // Store map instance on load
              >
                {/* User's Marker */}
                <Marker
                  position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                  title="Your Location"
                  icon={{ 
                    url: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png', 
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 20),
                  }}
                />
                {/* Vendor's Marker */}
                <Marker
                  position={{ lat: currentVendorPosition[0], lng: currentVendorPosition[1] }}
                  title={`Vendor: ${assignedVendor.username}`}
                  icon={{ 
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 7,
                    rotation: vehicleBearing,
                    fillColor: "#007bff",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                    anchor: new window.google.maps.Point(0, 2.5),
                  }}
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

  // == STATE 4: Request Completed ==
  if (activeRequest && activeRequest.status === 'COMPLETED') {
    return (
      <div className="form-card">
        <h2>Service Completed!</h2>
        <p>
          Your request for "<strong>{activeRequest.problemDescription}</strong>" has been marked as complete by{" "}
          <strong>{activeRequest.assignedVendor?.username}</strong>.
        </p>
        <button onClick={() => setActiveRequest(null)}>Okay</button>
      </div>
    );
  }

  // == STATE 1: Initial Booking Screen ==
  return (
    <>
      <div className="form-card">
        <h2>Book a Service</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            className="form-input"
            type="text"
            name="problemDescription"
            placeholder="What's the issue? (e.g., Flat tire)"
            value={newRequest.problemDescription}
            onChange={onInputChange}
            required
          />
          <button onClick={() => onRequestSubmit()} disabled={!newRequest.problemDescription} className="broadcast-button">
            Broadcast Request to All Vendors
          </button>
        </form>
      </div>

      <div className="user-list-section">
        <h2>Nearby Vendors</h2>
        <div className="map-view">
            <MapContainer center={[userLocation.latitude, userLocation.longitude]} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User's Location */}
              <LeafletMarker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                <Popup>You are here</Popup>
              </LeafletMarker>
              {/* Nearby Vendor Locations */}
              {vendorsWithDistances.map(vendor => (
                vendor.latitude && vendor.longitude && (
                  <LeafletMarker key={vendor.id} position={[vendor.latitude, vendor.longitude]} icon={vendorIcon}>
                    <Tooltip direction="top" offset={[0, -35]} opacity={1} permanent>
                      {vendor.username}
                    </Tooltip>
                  </LeafletMarker>
                )
              ))}
            </MapContainer>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;