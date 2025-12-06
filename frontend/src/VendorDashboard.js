import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './VendorDashboard.css';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


const VendorDashboard = ({ requests, workers, onAssignWorker, onRefreshRequests, loggedInUser }) => {
  const [selectedWorkers, setSelectedWorkers] = useState({}); // State to hold { requestId: workerId }

  useEffect(() => {
    // Set up an interval to refresh the service requests every 2 seconds
    const intervalId = setInterval(() => {
      if (onRefreshRequests) {
        onRefreshRequests();
      }
    }, 2000); // 2 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [onRefreshRequests]);
  
  const handleWorkerSelection = (requestId, workerId) => {
    setSelectedWorkers(prev => ({
      ...prev,
      [requestId]: workerId,
    }));
  };

  const getEligibleWorkers = (requestType) => {
    if (!workers || workers.length === 0 || !requestType) return [];
    
    return workers.filter(worker => {
      const isAvailable = worker.status === 'IDLE' || worker.status === 'COMPLETED';
      const canDoJob = worker.requestTypes.includes(requestType);
      return isAvailable && canDoJob;
    });
  };

  // Filter for requests that are OPEN and intended for the currently logged-in vendor.
  const openRequests = requests.filter(req => 
    req.status === 'OPEN' && 
    req.intendedVendor?.id === loggedInUser.id
  );

  return (
    <div className="vendor-dashboard">
      <div className="vendor-content-wrapper">
        <div className="request-list-container">
          <h2>Hello! Incoming Requests ({openRequests.length})</h2>
          {openRequests.length === 0 ? (
            <p>No new requests at the moment.</p>
          ) : (
            <div className="request-list">
              {openRequests.map(request => {
                const eligibleWorkers = getEligibleWorkers(request.problemDescription);
                return (
                  <div key={request.id} className="request-card">
                    <h3>New Request from {request.requestingUser.username}</h3>
                    <div className="request-details">
                      <p><strong>Problem:</strong> <span className="problem-tag">{request.problemDescription.replace(/_/g, ' ')}</span></p>
                      <p><strong>Vehicle:</strong> {request.vehicleNumber}</p>
                      <p><strong>Location:</strong> {request.requestingUser.address || 'Not specified'}</p>
                    </div>

                    {eligibleWorkers.length > 0 ? (
                      <div className="assignment-section">
                        <select
                          value={selectedWorkers[request.id] || ''}
                          onChange={(e) => handleWorkerSelection(request.id, e.target.value)}
                        >
                          <option value="" disabled>Select a worker to assign</option>
                          {eligibleWorkers.map(worker => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name || worker.username}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onAssignWorker(request.id, selectedWorkers[request.id])}
                          disabled={!selectedWorkers[request.id]}
                          className="assign-button"
                        >
                          Assign Worker
                        </button>
                      </div>
                    ) : (
                      <div className="no-workers-message">
                        <p>You have no available workers who can handle this service type.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="map-view-container">
          <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {openRequests.map(req => (
              req.requestingUser.latitude && req.requestingUser.longitude && (
                <Marker key={req.id} position={[req.requestingUser.latitude, req.requestingUser.longitude]}>
                  <Popup>
                    <b>{req.requestingUser.username}</b><br />
                    {req.problemDescription.replace(/_/g, ' ')}
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;