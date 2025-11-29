import React from 'react';
import { availableRequestTypes } from './constants';
import './UserList.css';
 
const UserList = ({ users, onShowCreateUser, onEditUser, onDeleteUser }) => {
  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>Manage Users</h2>
        <button onClick={onShowCreateUser} className="create-user-button">Create New User</button>
      </div>
      {users.length === 0 ? (
        <p className="no-users-message">No users found.</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role(s)</th>
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