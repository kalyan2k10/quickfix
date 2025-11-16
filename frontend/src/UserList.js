import React from 'react';
import './UserList.css';

const UserList = ({ users, onShowCreateUser }) => {
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
            <p><strong>Username:</strong> @{user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className="user-role-badge">{user.roles.join(', ')}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;