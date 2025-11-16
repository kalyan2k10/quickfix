import React, { useState, useRef } from 'react';
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import './Login.css';

const Login = ({ onLoginSubmit, onLoginInputChange, credentials, error, onSignUpSubmit, onSignUpInputChange, signUpFormState, setSignUpFormState, isLoaded, onSignupAutocompleteLoad, onSignUpPlaceChanged }) => {
  const [activeTab, setActiveTab] = useState('login');
  const mapRef = useRef(null);

  const mapContainerStyle = {
    height: '300px',
    width: '100%',
    marginTop: '1rem',
    borderRadius: '8px',
  };

  const center = {
    lat: signUpFormState.latitude || 12.9716, // Default to Bangalore
    lng: signUpFormState.longitude || 77.5946,
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSignUpFormState((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setSignUpFormState((prev) => ({ ...prev, address: results[0].formatted_address }));
      }
    });
  };

  return (
    <div className="login-container">
      <div className="login-art-section">
        <div className="art-content">
          <h1>Welcome to ZoomFix</h1>
          <p>Your reliable partner on the road. Fast, professional, and just a click away.</p>
          <div className="features-preview">
            <div className="feature-preview-item">⏱️ 10-Min Response</div>
            <div className="feature-preview-item">✅ On-Spot Repairs</div>
            <div className="feature-preview-item">🗺️ Live Tracking</div>
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
                <p className="form-section-subtitle">Enter an address or click on the map to set your location.</p>
                {isLoaded && (
                  <>
                    <Autocomplete
                      onLoad={onSignupAutocompleteLoad}
                      onPlaceChanged={onSignUpPlaceChanged}
                    >
                      <input 
                        className="form-input" 
                        type="text" 
                        name="address" 
                        placeholder="Start typing your address..." 
                        value={signUpFormState.address}
                        onChange={onSignUpInputChange}
                      />
                    </Autocomplete>
                    <GoogleMap
                      ref={mapRef}
                      mapContainerStyle={mapContainerStyle}
                      zoom={12}
                      center={center}
                      onClick={handleMapClick}
                    >
                      {signUpFormState.latitude && signUpFormState.longitude && <Marker position={center} />}
                    </GoogleMap>
                  </>
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