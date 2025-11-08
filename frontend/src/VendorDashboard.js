import React, { useState, useEffect } from 'react';
import './VendorDashboard.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const VendorDashboard = ({ requests, onUpdateRequest, loggedInUser }) => {
  const [vendorLocation, setVendorLocation] = useState(null);
  // State to track the active, accepted request for movement simulation
  const [acceptedRequest, setAcceptedRequest] = useState(null);

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

  // Find the accepted request for this vendor
  useEffect(() => {
    const myAcceptedRequest = requests.find(r => r.status === 'ASSIGNED' && r.assignedVendor?.id === loggedInUser.id);
    setAcceptedRequest(myAcceptedRequest);
  }, [requests, loggedInUser.id]);

  // Simulate vendor live location updates towards the user
  useEffect(() => {
    // Only run if there's an accepted request and we have the vendor's location
    if (acceptedRequest && vendorLocation) {
      const interval = setInterval(() => {
        const userLat = acceptedRequest.requestingUser.latitude;
        const userLon = acceptedRequest.requestingUser.longitude;
        const [vendorLat, vendorLon] = vendorLocation;

        // Simple distance check to stop when close
        const R = 6371; // Earth radius in km
        const dLat = (userLat - vendorLat) * Math.PI / 180;
        const dLon = (userLon - vendorLon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(vendorLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Stop simulation if vendor is very close (e.g., less than 50 meters)
        if (distance < 0.05) {
          clearInterval(interval);
          return;
        }

        // --- Movement Calculation ---
        const speedKmph = 600; // 600 km/h as requested for simulation
        const updateIntervalSeconds = 3;
        const distancePerInterval = (speedKmph / 3600) * updateIntervalSeconds; // distance in km

        // Total distance vector
        const totalDistLat = userLat - vendorLat;
        const totalDistLon = userLon - vendorLon;
        const totalDistance = Math.sqrt(totalDistLat ** 2 + totalDistLon ** 2);

        // Calculate movement step
        const stepLat = (totalDistLat / totalDistance) * (distancePerInterval / 111); // Approx 111km per degree latitude
        const stepLon = (totalDistLon / totalDistance) * (distancePerInterval / (111 * Math.cos(vendorLat * Math.PI / 180)));

        const newLat = vendorLat + stepLat;
        const newLon = vendorLon + stepLon;

        const newLocation = { latitude: newLat, longitude: newLon };

        // Update local state immediately for smooth UI
        setVendorLocation([newLat, newLon]);

        // Update backend with new live location (fire and forget)
        fetch(`/users/${loggedInUser.id}/live-location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLocation),
        }).catch(console.error);

      }, 3000); // Update location every 3 seconds

      return () => clearInterval(interval);
    }
  }, [acceptedRequest, vendorLocation, loggedInUser.id]);

  const handleAccept = (requestId) => {
    onUpdateRequest(requestId, 'accept');
  };

  if (!vendorLocation) {
    return <div className="form-card"><h2>Loading your location and requests...</h2></div>;
  }

  return (
    <div className="user-list-section">
      <h2>{acceptedRequest ? 'En Route to User' : 'Incoming Service Requests'}</h2>
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
          {requests.filter(r => !acceptedRequest || r.id === acceptedRequest.id).map(req => {
            const R = 6371;
            const dLat = (req.requestingUser.latitude - vendorLocation[0]) * Math.PI / 180;
            const dLon = (req.requestingUser.longitude - vendorLocation[1]) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(vendorLocation[0] * Math.PI / 180) * Math.cos(req.requestingUser.latitude * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (req.requestingUser.latitude && req.requestingUser.longitude) {
              return (
                <Marker key={req.id} position={[req.requestingUser.latitude, req.requestingUser.longitude]} icon={userRequestIcon}>
                  <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent>{distance.toFixed(1)} km away</Tooltip>
                  <Popup>
                    <strong>@{req.requestingUser.username}</strong><br />
                    Problem: {req.problemDescription}<br />
                    {req.status === 'OPEN' && <div className="request-actions">
                      <button onClick={() => handleAccept(req.id)}>Accept</button>
                      <button className="deny" onClick={() => onUpdateRequest(req.id, 'deny')}>Deny</button>
                    </div>}
                    {req.status === 'ASSIGNED' && <div className="request-actions">
                        <p><strong>Status:</strong> You have accepted this request. Head to the user's location.</p>
                    </div>}
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