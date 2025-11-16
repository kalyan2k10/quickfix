import React from 'react';
import './UserList.css';

const UserList = ({ users, onShowCreateUser }) => {
  const getRoleIcon = (roles) => {
    if (roles.includes('ADMIN')) return '🛡️'; // Captain/Admin Shield
    if (roles.includes('VENDOR')) return '🚗'; // Car for Vendor
    return '👤'; // Human for User
  };

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>Existing Users ({users.length})</h2>
        <button onClick={onShowCreateUser} className="action-button">
          &#43; Create New User
        </button>
      </div>
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-card-icon">{getRoleIcon(user.roles)}</div>
            <div className="user-card-details">
              <p><strong>Username:</strong> @{user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <span className="user-role-badge">{user.roles.join(', ')}</span></p>
              {user.address && <p><strong>Location:</strong> {user.address}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;