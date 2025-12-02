import React, { useState, useEffect } from 'react';
import './VendorDashboard.css';

const VendorDashboard = ({ requests, workers, onAssignWorker, onRefreshRequests }) => {
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

  const openRequests = requests.filter(req => req.status === 'OPEN');

  return (
    <div className="vendor-dashboard">
      <h2>Incoming Service Requests</h2>
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
  );
};

export default VendorDashboard;