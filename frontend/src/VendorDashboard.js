import React, { useState, useEffect } from 'react';
import './VendorDashboard.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const VendorDashboard = ({ requests, onUpdateRequest, loggedInUser, authHeaders, fetchServiceRequests }) => {
  const [vendorLocation, setVendorLocation] = useState(null);

  // Custom icons
  const userRequestIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    ...L.Icon.Default.prototype.options
  });

  const vendorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    ...L.Icon.Default.prototype.options
  });

  useEffect(() => {
    if (loggedInUser && loggedInUser.latitude && loggedInUser.longitude) {
      setVendorLocation([loggedInUser.latitude, loggedInUser.longitude]);
    }
  }, [loggedInUser]);

  // Fetch requests on initial mount
  useEffect(() => {
    fetchServiceRequests(authHeaders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new requests every 5 seconds if no request is currently accepted
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServiceRequests(authHeaders);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [authHeaders, fetchServiceRequests]);

  const handleAccept = (requestId) => {
    onUpdateRequest(requestId, 'accept');
  };

  if (!vendorLocation) {
    return <div className="form-card"><h2>Loading your location and requests...</h2></div>;
  }

  return (
    <div className="user-list-section">
      <h2>Incoming Service Requests</h2>
      <div className="map-view">
        <MapContainer center={vendorLocation} zoom={12} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Vendor's own location */}
          {vendorLocation && (
            <Marker position={vendorLocation} icon={vendorIcon}>
              <Popup>This is you!</Popup>
            </Marker>
          )}
          {/* Markers for open requests */}
          {requests.filter(req => req.status === 'OPEN').map(req => {
            if (req.requestingUser.latitude && req.requestingUser.longitude) {
              return (
                <Marker key={req.id} position={[req.requestingUser.latitude, req.requestingUser.longitude]} icon={userRequestIcon}>
                  <Popup>
                    <strong>@{req.requestingUser.username}</strong><br />
                    Problem: {req.problemDescription}<br />
                    <div className="request-actions">
                      <button onClick={() => handleAccept(req.id)}>Accept</button>
                      {/* The 'deny' button is removed as the backend doesn't handle it yet */}
                      {/* <button className="deny" onClick={() => onUpdateRequest(req.id, 'deny')}>Deny</button> */}
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null; // Return null if the request has no location
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default VendorDashboard;