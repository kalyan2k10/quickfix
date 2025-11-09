import React, { useState, useEffect } from 'react';
import './VendorDashboard.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import RoutingMachine from './RoutingMachine'; // Import the routing component

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

  // Effect for live location tracking of the vendor
  useEffect(() => {
    let locationWatcherId = null;

    // Start watching location only when the vendor is logged in
    if (loggedInUser) {
      locationWatcherId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];

          // Update local state for immediate feedback on the vendor's map
          setVendorLocation(newLocation);

          // Send the new location to the backend
          fetch(`/users/${loggedInUser.id}/live-location`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ latitude, longitude }),
          }).catch(err => console.error("Failed to send live location:", err));
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options for better accuracy
      );
    }

    // Cleanup: stop watching when the component unmounts
    return () => {
      if (locationWatcherId) navigator.geolocation.clearWatch(locationWatcherId);
    };
  }, [loggedInUser, authHeaders]);

  const handleAccept = (requestId) => {
    onUpdateRequest(requestId, 'accept');
  };

  if (!vendorLocation) {
    return <div className="form-card"><h2>Loading your location and requests...</h2></div>;
  }

  const assignedRequest = requests.find(req => req.status === 'ASSIGNED' && req.assignedVendor?.id === loggedInUser.id);
  const openRequests = requests.filter(req => req.status === 'OPEN');

  // == STATE: Vendor has an active, assigned request ==
  if (assignedRequest) {
    const userPosition = [assignedRequest.requestingUser.latitude, assignedRequest.requestingUser.longitude];

    // Function to open Google Maps for navigation
    const handleStartNavigation = () => {
      const origin = `${vendorLocation[0]},${vendorLocation[1]}`;
      const destination = `${userPosition[0]},${userPosition[1]}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank');
    };

    return (
      <>
        <div className="form-card">
          <h2>Active Job: En Route to User</h2>
          <p>You have accepted a request from <strong>@{assignedRequest.requestingUser.username}</strong>.</p>
          <p>Issue: <strong>{assignedRequest.problemDescription}</strong></p>
          {/* Add the navigation button here */}
          <button className="accept" onClick={handleStartNavigation}>Start Navigation in Google Maps</button>
          <p><em>The user is tracking your location. Head to their position. The request will be marked as complete by the user upon service completion.</em></p>
        </div>
        <div className="user-list-section">
          <h2>Job Location</h2>
          <div className="map-view">
            <MapContainer center={userPosition} zoom={13} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={vendorLocation} icon={vendorIcon}>
                <Popup>Your current location</Popup>
              </Marker>
              <Marker position={userPosition} icon={userRequestIcon}>
                <Popup>
                  User: @{assignedRequest.requestingUser.username}<br />
                  Problem: {assignedRequest.problemDescription}
                </Popup>
              </Marker>
              <RoutingMachine start={vendorLocation} end={userPosition} />
            </MapContainer>
          </div>
        </div>
      </>
    );
  }

  // == STATE: Vendor is available for new requests ==
  return (
    <>
      <div className="user-list-section">
        <h2>Incoming Service Requests</h2>
        <div className="map-view">
          <MapContainer center={vendorLocation} zoom={12} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vendorLocation && (
              <Marker position={vendorLocation} icon={vendorIcon}>
                <Popup>This is you!</Popup>
              </Marker>
            )}
            {openRequests.map(req => (
              req.requestingUser.latitude && req.requestingUser.longitude && (
                  <Marker key={req.id} position={[req.requestingUser.latitude, req.requestingUser.longitude]} icon={userRequestIcon}>
                    <Popup>
                      <strong>@{req.requestingUser.username}</strong><br />
                      Problem: {req.problemDescription}<br />
                      <div className="request-actions">
                        <button onClick={() => handleAccept(req.id)}>Accept</button>
                      </div>
                    </Popup>
                  </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
      <div className="user-list-section">
        <h2>Available Jobs ({openRequests.length})</h2>
        {openRequests.length > 0 ? openRequests.map(req => (
          <div key={req.id} className="user-card">
            <p><strong>User:</strong> @{req.requestingUser.username}</p>
            <p><strong>Problem:</strong> {req.problemDescription}</p>
            <button className="accept" onClick={() => handleAccept(req.id)}>Accept Request</button>
          </div>
        )) : <p>No open service requests in your area right now. We'll notify you when a new one comes in.</p>}
      </div>
    </>
  );
};

export default VendorDashboard;