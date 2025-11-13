import React, { useState, useEffect } from 'react';
import './VendorDashboard.css';
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';

const VendorDashboard = ({ requests, onUpdateRequest, loggedInUser, authHeaders, fetchServiceRequests, isLoaded, loadError }) => {
  const [vendorLocation, setVendorLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null); // To show one popup at a time

  // Custom icons
  const userRequestIcon = {
    url: 'https://maps.google.com/mapfiles/kml/shapes/man.png', // Human icon for user requests
    scaledSize: new window.google.maps.Size(25, 41),
    anchor: new window.google.maps.Point(12, 41),
  };

  const vendorIcon = {
    url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png', // Car icon for the vendor
    scaledSize: new window.google.maps.Size(25, 41),
    anchor: new window.google.maps.Point(12, 41),
  };

  useEffect(() => {
    if (loggedInUser && loggedInUser.latitude && loggedInUser.longitude) {
      setVendorLocation([loggedInUser.latitude, loggedInUser.longitude]);
    }
  }, [loggedInUser]);

  // Poll for new requests every 2 seconds
  useEffect(() => {
    const assignedRequest = requests.find(req => req.status === 'ASSIGNED' && req.assignedVendor?.id === loggedInUser.id);
    if (!assignedRequest) {
      const interval = setInterval(() => {
        fetchServiceRequests(authHeaders);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [authHeaders, fetchServiceRequests]);

  // Effect for live location tracking of the vendor
  useEffect(() => {
    let locationWatcherId = null;

    if (loggedInUser) {
      locationWatcherId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          setVendorLocation(newLocation);

          // Send the new location to the backend
          fetch(`/users/${loggedInUser.id}/live-location`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ latitude, longitude }),
          }).catch(err => console.error("Failed to send live location:", err));
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (locationWatcherId) navigator.geolocation.clearWatch(locationWatcherId);
    };
  }, [loggedInUser, authHeaders]);

  const handleAccept = (requestId) => {
    onUpdateRequest(requestId, 'accept');
  };

  // Effect to calculate route for assigned request
  useEffect(() => {
    const assignedRequest = requests.find(req => req.status === 'ASSIGNED' && req.assignedVendor?.id === loggedInUser.id);
    if (isLoaded && assignedRequest && vendorLocation) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(vendorLocation[0], vendorLocation[1]),
          destination: new window.google.maps.LatLng(assignedRequest.requestingUser.latitude, assignedRequest.requestingUser.longitude),
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error(`error fetching directions ${result}`);
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null); // Clear directions if no longer assigned
    }
  }, [isLoaded, requests, vendorLocation, loggedInUser.id]);

  if (!vendorLocation) {
    return <div className="form-card"><h2>Loading your location and requests...</h2></div>;
  }

  const assignedRequest = requests.find(req => req.status === 'ASSIGNED' && req.assignedVendor?.id === loggedInUser.id);

  // == STATE: Vendor has an active, assigned request ==
  if (assignedRequest) {
    const userPosition = [assignedRequest.requestingUser.latitude, assignedRequest.requestingUser.longitude];

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
          <button className="accept" onClick={handleStartNavigation}>Start Navigation</button>
          <p><em>The user is tracking your location. Head to their position.</em></p>
        </div>
        <div className="user-list-section">
          <h2>Job Location</h2>
          {isLoaded && (
            <div className="map-view">
              <GoogleMap mapContainerClassName="map-view-container" center={{ lat: userPosition[0], lng: userPosition[1] }} zoom={13}>
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </div>
          )}
        </div>
      </>
    );
  }

  // == STATE: Vendor is available for new requests ==
  const openRequests = requests.filter(req => req.status === 'OPEN');
  return (
    <>
      <div className="user-list-section">
        <h2>Incoming Service Requests</h2>
        {isLoaded && (
          <div className="map-view">
            <GoogleMap mapContainerClassName="map-view-container" center={{ lat: vendorLocation[0], lng: vendorLocation[1] }} zoom={12}>
              <Marker position={{ lat: vendorLocation[0], lng: vendorLocation[1] }} icon={vendorIcon} title="This is you!" />
              
              {openRequests.map(req => (
                req.requestingUser.latitude && req.requestingUser.longitude && (
                    <Marker key={req.id} position={{ lat: req.requestingUser.latitude, lng: req.requestingUser.longitude }} icon={userRequestIcon} onClick={() => setActiveInfoWindow(req.id)}>
                      {activeInfoWindow === req.id && (
                        <InfoWindow onCloseClick={() => setActiveInfoWindow(null)}>
                          <div>
                            <strong>@{req.requestingUser.username}</strong><br />
                            Problem: {req.problemDescription}<br />
                            <div className="request-actions">
                              <button className="accept" onClick={() => handleAccept(req.id)}>Accept</button>
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                )
              ))}
            </GoogleMap>
          </div>
        )}
      </div>
      <div className="user-list-section">
        <h2>Available Jobs ({openRequests.length})</h2>
        {openRequests.length > 0 ? openRequests.map(req => (
          <div key={req.id} className="user-card">
            <p><strong>User:</strong> @{req.requestingUser.username}</p>
            <p><strong>Problem:</strong> {req.problemDescription}</p>
            <button className="accept" onClick={() => handleAccept(req.id)}>Accept Request</button>
          </div>
        )) : <p>No open service requests in your area right now.</p>}
      </div>
    </>
  );
};

export default VendorDashboard;