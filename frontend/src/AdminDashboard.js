import React, { useRef } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import './AdminDashboard.css';

const AdminDashboard = ({
  newUser,
  onInputChange,
  onUserSubmit,
  isLoaded,
  onAdminAutocompleteLoad,
  onAdminPlaceChanged,
  setNewUser,
  onViewUsersClick,
}) => {
  const mapRef = useRef(null);

  const mapContainerStyle = {
    height: '400px',
    width: '100%',
    marginBottom: '1rem',
  };

  const center = {
    lat: newUser.latitude || 12.9716,
    lng: newUser.longitude || 77.5946,
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setNewUser((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    // Geocode the location to get an address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          const formattedAddress = results[0].formatted_address;
          setNewUser((prev) => ({ ...prev, address: formattedAddress, latitude: lat, longitude: lng }));
        }
      }
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-form-container">
        <div className="form-header">
          <h2>Create New User</h2>
          <button onClick={onViewUsersClick} className="action-button">
            View All Users
          </button>
        </div>

        <form onSubmit={onUserSubmit}>
          <input className="form-input" type="text" name="username" placeholder="Username" value={newUser.username} onChange={onInputChange} required />
          <input className="form-input" type="password" name="password" placeholder="Password" value={newUser.password} onChange={onInputChange} required />
          <input className="form-input" type="email" name="email" placeholder="Email" value={newUser.email} onChange={onInputChange} required />
          <select className="form-input" name="role" value={newUser.role} onChange={onInputChange}>
            <option value="USER">User</option>
            <option value="VENDOR">Vendor</option>
            <option value="ADMIN">Admin</option>
          </select>

          {isLoaded && (
            <>
              <Autocomplete
                onLoad={(autocomplete) => {
                  onAdminAutocompleteLoad(autocomplete);
                }}
                onPlaceChanged={onAdminPlaceChanged}
              >
                <input
                  className="form-input"
                  type="text"
                  name="address"
                  placeholder="Enter a location"
                  value={newUser.address || ''}
                  onChange={onInputChange}
                />
              </Autocomplete>
              <GoogleMap
                ref={mapRef}
                mapContainerStyle={mapContainerStyle}
                zoom={12}
                center={center}
                onClick={handleMapClick}
              >
                {newUser.latitude && newUser.longitude && (
                  <Marker position={{ lat: newUser.latitude, lng: newUser.longitude }} />
                )}
              </GoogleMap>
            </>
          )}

          <button type="submit" className="submit-button">Create User</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;