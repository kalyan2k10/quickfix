import React from 'react';
import './Login.css';

const Login = ({ onLoginSubmit, onLoginInputChange, credentials, error }) => {
  return (
    <div className="login-card">
      <h2>Login</h2>
      <form onSubmit={onLoginSubmit}>
        <input
          className="form-input"
          type="text"
          name="username"
          placeholder="Username"
          value={credentials.username}
          onChange={onLoginInputChange}
          required
        />
        <input
          className="form-input"
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={onLoginInputChange}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Login;