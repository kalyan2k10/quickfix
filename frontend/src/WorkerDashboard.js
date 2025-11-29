import React from 'react';
import { availableRequestTypes } from './constants';
import './WorkerDashboard.css';

const WorkerDashboard = ({ loggedInUser }) => {
  // No state or effects needed as we are only displaying the existing data
  const workerName = loggedInUser.name || loggedInUser.username;

  return (
    <div className="worker-dashboard">
      <h2>{workerName}'s Dashboard</h2>
      <p>Welcome! Here are the services you are registered to provide.</p>
      <div className="service-types-display">
        {loggedInUser.requestTypes && loggedInUser.requestTypes.length > 0 ? (
          loggedInUser.requestTypes.map(typeValue => {
            // Find the corresponding label from availableRequestTypes
            const service = availableRequestTypes.find(item => item.value === typeValue);
            return (
              <span key={typeValue} className="service-tag">
                {service ? service.label : typeValue.replace(/_/g, ' ')}
              </span>
            );
          })
        ) : (
          <p>No services currently listed. Please contact support to update your services.</p>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;