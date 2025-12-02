import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { availableRequestTypes } from './constants';
import './UserList.css';
 
const UserList = ({ users, onShowCreateUser, onEditUser, onDeleteUser, onRefreshUsers, isLoaded, loadError }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'map'
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Set up an interval to refresh the user list every 2 seconds
    const intervalId = setInterval(() => {
      if (onRefreshUsers) {
        onRefreshUsers();
      }
    }, 2000); // 2 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [onRefreshUsers]);

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
  };

  // Calculate the center of the map based on user locations
  const getMapCenter = (usersWithLocation) => {
    if (usersWithLocation.length === 0) {
      return { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore if no users have locations
    }

    const latSum = usersWithLocation.reduce((sum, user) => sum + parseFloat(user.latitude), 0);
    const lngSum = usersWithLocation.reduce((sum, user) => sum + user.longitude, 0);

    return {
      lat: latSum / usersWithLocation.length,
      lng: lngSum / usersWithLocation.length,
    };
  };

  // Define custom icons for different user roles, requires window.google to be loaded
  const getMarkerIcon = (user) => {
    if (!window.google) return null;

    const baseIcon = {
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 40),
      labelOrigin: new window.google.maps.Point(20, -10),
    };

    let url;
    if (user.roles.includes('ADMIN')) {
      url = 'https://maps.google.com/mapfiles/kml/shapes/office.png'; // Building icon for Admin
    } else if (user.roles.includes('VENDOR')) {
      url = 'https://maps.google.com/mapfiles/kml/shapes/cabs.png'; // Car icon for Vendor
    } else if (user.roles.includes('WORKER')) {
      url = 'https://maps.google.com/mapfiles/kml/shapes/motorcycling.png'; // Bike icon for Worker
    } else {
      url = 'https://maps.google.com/mapfiles/kml/shapes/man.png'; // Default person icon for User
    }

    return { ...baseIcon, url };
  };

  const renderMapView = () => {
    if (loadError) {
      return <div>Error loading maps. Please check your API key and network connection.</div>;
    }

    if (!isLoaded) {
      return <div>Loading Map...</div>;
    }

    // Filter for users with location right before rendering the map
    const usersWithLocation = users.filter(user => user.latitude && user.longitude);

    // If we reach here, isLoaded is true, so window.google is available.
    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getMapCenter(usersWithLocation)}
        zoom={12}
        onLoad={() => setSelectedUser(null)} // Clear selected user on map load/reload
      >
        {usersWithLocation.map(user => (
          <Marker
            key={user.id}
            position={{ lat: user.latitude, lng: user.longitude }}
            title={user.name || user.username}
            icon={getMarkerIcon(user)}
            onClick={() => setSelectedUser(user)}
          />
        ))}

        {selectedUser && (
          <InfoWindow
            position={{ lat: selectedUser.latitude, lng: selectedUser.longitude }}
            onCloseClick={() => setSelectedUser(null)}
          >
            <div className="map-infowindow">
              <h4>{selectedUser.name || selectedUser.username}</h4>
              <p><strong>Role:</strong> {selectedUser.roles.join(', ')}</p>
              <p><strong>Status:</strong> {selectedUser.status}</p>
              <p><strong>Address:</strong> {selectedUser.address || 'N/A'}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>Manage Users</h2>
        <div className="header-actions">
          <div className="view-switcher">
            <button onClick={() => setViewMode('table')} className={`view-button ${viewMode === 'table' ? 'active' : ''}`}>Table View</button>
            <button onClick={() => setViewMode('map')} className={`view-button ${viewMode === 'map' ? 'active' : ''}`}>Map View</button>
          </div>
          <button onClick={onShowCreateUser} className="create-user-button">Create New User</button>
        </div>
      </div>
      {viewMode === 'map' ? (
        renderMapView()
      ) : users.length === 0 ? (
        <p className="no-users-message">No users found.</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role(s)</th>
              <th>Status</th>
              <th>Assigned Workers</th>
              <th>Service Types</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.roles.join(', ')}</td>
                <td>
                  <span className={`status-tag status-${(user.status || 'IDLE').toLowerCase()}`}>
                    {user.status || 'IDLE'}
                  </span>
                </td>
                <td>
                  {user.roles.includes('VENDOR') && user.workers?.length > 0 ? (
                    user.workers.map(workerId => {
                      const worker = users.find(u => u.id === workerId);
                      return <span key={workerId} className="worker-tag">{worker ? (worker.name || worker.username) : `ID: ${workerId}`}</span>;
                    })
                  ) : 'N/A'}
                </td>
                <td>
                  {(() => {
                    if (user.roles.includes('WORKER')) {
                      return user.requestTypes?.map(type => {
                        const service = availableRequestTypes.find(rt => rt.value.toUpperCase().replace(/ /g, '_') === type);
                        return <span key={type} className="service-tag-small">{service ? service.label : type}</span>;
                      });
                    }
                    if (user.roles.includes('VENDOR')) {
                      const workerServices = new Set();
                      user.workers?.forEach(workerId => {
                        const worker = users.find(u => u.id === workerId);
                        worker?.requestTypes?.forEach(service => workerServices.add(service));
                      });
                      if (workerServices.size === 0) return 'No services from workers';
                      return Array.from(workerServices).map(type => {
                        const service = availableRequestTypes.find(rt => rt.value.toUpperCase().replace(/ /g, '_') === type);
                        return <span key={type} className="service-tag-small">{service ? service.label : type}</span>;
                      });
                    }
                    return 'N/A';
                  })()}
                </td>
                <td className="user-actions">
                  <button onClick={() => onEditUser(user)} className="action-button edit-button">Edit</button>
                  <button onClick={() => onDeleteUser(user.id)} className="action-button delete-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;