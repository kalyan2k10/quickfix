import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import './Login.css';

const Login = ({ onLoginSubmit, onLoginInputChange, credentials, error, onSignUpSubmit, onSignUpInputChange, signUpFormState, isLoaded, onSignupAutocompleteLoad, onSignUpPlaceChanged }) => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="login-container">
      <div className="login-art-section">
        <div className="art-content">
          <h1>Welcome to ZoomFix</h1>
          <p>Your reliable partner on the road. Fast help is just a click away.</p>
          <div className="features-preview">
            <div className="feature-preview-item">⏱️ 30-Min Response</div>
            <div className="feature-preview-item">✅ On-Spot Repairs</div>
            <div className="feature-preview-item">🗺️ Bangalore-Wide</div>
          </div>
        </div>
      </div>
      <div className="login-form-section">
        <div className="form-container">
          <div className="tabs">
            <button className={`tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Login</button>
            <button className={`tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => setActiveTab('signup')}>Sign Up</button>
          </div>

          {activeTab === 'login' && (
            <div className="form-content">
              <h2>Welcome Back!</h2>
              <form onSubmit={onLoginSubmit}>
                <input className="form-input" type="text" name="username" placeholder="Username" value={credentials.username} onChange={onLoginInputChange} required />
                <input className="form-input" type="password" name="password" placeholder="Password" value={credentials.password} onChange={onLoginInputChange} required />
                <button type="submit">Login</button>
              </form>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}

          {activeTab === 'signup' && (
            <div className="form-content">
              <h2>Create Your Account</h2>
              <form onSubmit={onSignUpSubmit}>
                <input className="form-input" type="text" name="username" placeholder="Username" value={signUpFormState.username} onChange={onSignUpInputChange} required />
                <input className="form-input" type="email" name="email" placeholder="Email" value={signUpFormState.email} onChange={onSignUpInputChange} required />
                <input className="form-input" type="password" name="password" placeholder="Password" value={signUpFormState.password} onChange={onSignUpInputChange} required />
                
                <p className="form-section-title">Your Location (Optional)</p>
                {isLoaded && (
                  <Autocomplete
                    onLoad={onSignupAutocompleteLoad}
                    onPlaceChanged={onSignUpPlaceChanged}
                  >
                    <input className="form-input" type="text" name="address" placeholder="Start typing your address..." defaultValue={signUpFormState.address} />
                  </Autocomplete>
                )}
                <input className="form-input" type="hidden" name="latitude" value={signUpFormState.latitude} />
                <input className="form-input" type="hidden" name="longitude" value={signUpFormState.longitude} />

                <button type="submit">Create Account</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;