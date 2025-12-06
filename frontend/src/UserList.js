import React, { useState, useEffect } from 'react';
import { availableRequestTypes } from './constants';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './UserList.css';
 
// --- Custom Leaflet Icons ---

// Fix for default icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', // Using a placeholder, ideally a human icon
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const UserList = ({ users, onShowCreateUser, onEditUser, onDeleteUser, onRefreshUsers, onDownload }) => {
  const [view, setView] = useState('table'); // 'table' or 'map'

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

  const usersWithLocation = users.filter(user => user.latitude && user.longitude);

  const getIconForUser = (user) => {
    const role = user.roles[0]; // Assuming the primary role is the first one
    switch (role) {
      case 'USER':
        // Using the 'man' icon for USER, consistent with UserDashboard
        return new L.Icon({ iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/man.png', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
      case 'VENDOR':
        // Using the 'cabs' icon for VENDOR, consistent with UserDashboard
        return new L.Icon({ iconUrl: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
      case 'WORKER':
        // Using a green icon for WORKER
        return new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
      default:
        // Default grey icon
        return new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    }
  };

 return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>Manage Users</h2>
        <div className="header-actions">
          <div className="view-switcher">
            <button
              className={`view-button ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              className={`view-button ${view === 'map' ? 'active' : ''}`}
              onClick={() => setView('map')}
            >
              Map
            </button>
          </div>
          <button onClick={onShowCreateUser} className="create-user-button">Create New User</button>
        </div>
      </div>

      {view === 'table' && (
        users.length === 0 ? (
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
                <th>Uploaded Documents</th>
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
                  <td className="document-links">
                    {user.photo && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/photo`, `photo_${user.username}.jpg`); }}>Photo</a></div>}
                    {user.panCard && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/pancard`, `pancard_${user.username}.pdf`); }}>PAN Card</a></div>}
                    {user.adhaarCard && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/adhaarcard`, `adhaarcard_${user.username}.pdf`); }}>Aadhaar Card</a></div>}
                    {user.voterId && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/voterid`, `voterid_${user.username}.pdf`); }}>Voter ID</a></div>}
                    {user.digitalSignature && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/digitalsignature`, `digitalsignature_${user.username}.pdf`); }}>Digital Signature</a></div>}
                    {user.shopRegistration && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/shopregistration`, `shopregistration_${user.username}.pdf`); }}>Shop Registration</a></div>}
                    {user.userAgreement && <div><a href="#" onClick={(e) => { e.preventDefault(); onDownload(`/users/${user.id}/documents/useragreement`, `useragreement_${user.username}.pdf`); }}>User Agreement</a></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {view === 'map' && (
        <div className="map-view-container" style={{ marginTop: '1.5rem' }}>
          {usersWithLocation.length > 0 ? (
            <MapContainer center={[usersWithLocation[0].latitude, usersWithLocation[0].longitude]} zoom={10} scrollWheelZoom={false} style={{ height: '600px', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {usersWithLocation.map(user => (
                <Marker key={user.id} position={[user.latitude, user.longitude]} icon={getIconForUser(user)}>
                  <Popup>Name: {user.name || user.username}<br />Role: {user.roles.join(', ')}</Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : <p>No users with location data to display on the map.</p>}
        </div>
      )}
    </div>
  );
};

export default UserList;