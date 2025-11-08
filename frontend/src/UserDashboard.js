import React, { useState, useEffect } from 'react';
import './UserDashboard.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// A simple component for a loading spinner
const Spinner = () => <div className="spinner"></div>;

const UserDashboard = ({ newRequest, onInputChange, onRequestSubmit, vendorsWithDistances, userLocation, activeRequest, setActiveRequest, authHeaders, nearestVendor, fare, distance, onCompleteRequest }) => {
  const [liveVendorLocation, setLiveVendorLocation] = useState(null);

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
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const vendorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    ...L.Icon.Default.prototype.options
  });

  const nearestVendorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png', // Gold for nearest
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    ...L.Icon.Default.prototype.options
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
        <p>Your service request will be broadcast to all available vendors in the area.</p>
      </div>
    </>
  );
};

export default UserDashboard;