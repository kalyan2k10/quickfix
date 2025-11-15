import React from 'react';
import { Autocomplete } from '@react-google-maps/api';
import './AdminDashboard.css';

const AdminDashboard = ({ users, newUser, onInputChange, onUserSubmit, isLoaded, onAdminAutocompleteLoad, onAdminPlaceChanged }) => (
  <div className="admin-dashboard">
    <div className="admin-form-container">
      <div className="form-card">
        <h2>Create a New User</h2>
        <form onSubmit={onUserSubmit}>
          <input className="form-input" type="text" name="username" placeholder="Username" value={newUser.username} onChange={onInputChange} required />
          <input className="form-input" type="password" name="password" placeholder="Password" value={newUser.password} onChange={onInputChange} required />
          <input className="form-input" type="email" name="email" placeholder="Email" value={newUser.email} onChange={onInputChange} required />
          <select name="role" value={newUser.role} onChange={onInputChange} className="form-input">
            <option value="USER">User</option>
            <option value="VENDOR">Vendor</option>
            <option value="ADMIN">Admin</option>
          </select>

          {['USER', 'VENDOR'].includes(newUser.role) && (
            <>
              {isLoaded && (
                <Autocomplete
                  onLoad={onAdminAutocompleteLoad}
                  onPlaceChanged={onAdminPlaceChanged}
                >
                  <input className="form-input" type="text" name="address" placeholder="Start typing user's address..." defaultValue={newUser.address} onChange={onInputChange} />
                </Autocomplete>
              )}
              {/* Hidden inputs to hold the lat/lng values */}
              <input type="hidden" name="latitude" value={newUser.latitude} />
              <input type="hidden" name="longitude" value={newUser.longitude} />
            </>
          )}

          <button type="submit">Add User</button>
        </form>
      </div>
    </div>

    <div className="admin-list-container">
      <div className="user-list-section">
        <h2>All Users ({users.length})</h2>
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id} className="user-card">
              <div className="user-card-header">
                <span className="user-role-badge">{user.roles.join(', ')}</span>
                <strong>@{user.username}</strong>
              </div>
              <p><strong>Email:</strong> {user.email}</p>
              {user.address && <p><strong>Location:</strong> {user.address}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default AdminDashboard;