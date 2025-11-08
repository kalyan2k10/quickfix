import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ users, newUser, onInputChange, onUserSubmit }) => (
  <>
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
        <button type="submit">Add User</button>
      </form>
    </div>
    <div className="user-list-section">
      <h2>All Users</h2>
      <ul className="user-list">
        {users.map(user => (
          <li key={user.id} className="user-card">
            <p><strong>Username:</strong> @{user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default AdminDashboard;