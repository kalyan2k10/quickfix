import React, { useState, useEffect } from 'react';
import './UserDashboard.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import RoutingMachine from './RoutingMachine';

// A simple component for a loading spinner
const Spinner = () => <div className="spinner"></div>;

const UserDashboard = ({ newRequest, onInputChange, onRequestSubmit, vendorsWithDistances, userLocation, activeRequest, setActiveRequest, authHeaders, nearestVendor, fare, distance, onCompleteRequest }) => {
  const [liveVendorLocation, setLiveVendorLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

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

  // Polling for live vendor location when assigned
  useEffect(() => {
    if (activeRequest && activeRequest.status === 'ASSIGNED' && activeRequest.assignedVendor?.latitude && activeRequest.assignedVendor?.longitude) {
      const vendorId = activeRequest.assignedVendor.id;
      const interval = setInterval(() => {
        fetch(`/users/${vendorId}`, { headers: authHeaders }) // Fetch the vendor's updated user object
          .then(res => res.json())
          .then(vendorData => {
            if (vendorData.latitude && vendorData.longitude) {
              setLiveVendorLocation({ latitude: vendorData.latitude, longitude: vendorData.longitude });
            }
          })
          .catch(console.error);
      }, 3000); // Poll every 3 seconds for live location

      return () => clearInterval(interval);
    } else {
      setLiveVendorLocation(null); // Clear live location if not assigned
    }
  }, [activeRequest, authHeaders]);

  const handleRouteFound = (summary) => {
    // summary contains totalDistance (meters) and totalTime (seconds)
    setRouteInfo(summary);
  };

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
    const currentVendorPosition = liveVendorLocation ? [liveVendorLocation.latitude, liveVendorLocation.longitude] : [assignedVendor.latitude, assignedVendor.longitude];

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
          <div className="map-view">
            <MapContainer center={userPosition} zoom={13} scrollWheelZoom={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={userPosition} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>
              <Marker position={currentVendorPosition} icon={vendorIcon}>
                <Popup>{assignedVendor.username} is here</Popup>
              </Marker>
              <RoutingMachine start={userPosition} end={currentVendorPosition} onRouteFound={handleRouteFound} />
            </MapContainer>
          </div>
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
            <MapContainer center={[userLocation.latitude, userLocation.longitude]} zoom={12} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User's Location */}
              <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>
              {/* Nearby Vendor Locations */}
              {vendorsWithDistances.map(vendor => (
                vendor.latitude && vendor.longitude && (
                  <Marker key={vendor.id} position={[vendor.latitude, vendor.longitude]} icon={vendorIcon}>
                    <Tooltip direction="top" offset={[0, -35]} opacity={1} permanent>
                      {vendor.username}
                    </Tooltip>
                  </Marker>
                )
              ))}
            </MapContainer>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;