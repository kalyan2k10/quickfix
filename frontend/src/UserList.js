import React from 'react';
import './UserList.css';
 
const UserList = ({ users, onShowCreateUser, onEditUser, onDeleteUser }) => {
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
              {user.roles.includes('VENDOR') && user.requestTypes && user.requestTypes.length > 0 && (
                <p>
                  <strong>Services:</strong> <span className="services-list">{user.requestTypes.join(', ')}</span>
                </p>
              )}
              {user.roles.includes('VENDOR') && user.hasDocuments && (
                 <div className="document-links">
                   <strong>Documents:</strong>
                   {user.panCard && (
                      <div><a href={`http://localhost:8080/users/${user.id}/documents/pancard`} target="_blank" rel="noopener noreferrer">PAN Card</a></div>
                   )}
                   {user.adhaarCard && (
                      <div><a href={`http://localhost:8080/users/${user.id}/documents/adhaarcard`} target="_blank" rel="noopener noreferrer">Aadhaar Card</a></div>
                   )}
                    {user.digitalSignature && (
                      <div><a href={`http://localhost:8080/users/${user.id}/documents/digitalsignature`} target="_blank" rel="noopener noreferrer">Digital Signature</a></div>
                    )}
                    {user.voterId && (
                      <div><a href={`http://localhost:8080/users/${user.id}/documents/voterid`} target="_blank" rel="noopener noreferrer">Voter ID</a></div>
                    )}
                    {user.shopRegistration && (
                      <div><a href={`http://localhost:8080/users/${user.id}/documents/shopregistration`} target="_blank" rel="noopener noreferrer">Shop Registration</a></div>
                    )}
                 </div>
               )}
              <div className="user-actions">
                <button onClick={() => onEditUser(user)} className="action-button edit-button">Edit</button>
                <button onClick={() => onDeleteUser(user.id)} className="action-button delete-button">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;