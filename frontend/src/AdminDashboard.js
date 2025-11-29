import React, { useState, useRef } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { availableRequestTypes } from './constants';
import './AdminDashboard.css';

const AdminDashboard = ({
  newUser,
  editingUser,
  onInputChange,
  onUserSubmit,
  isLoaded,
  onFileChange, // New prop for handling file inputs
  onAdminAutocompleteLoad,
  onAdminPlaceChanged,
  setNewUser,
  newUserRequestTypes,
  setNewUserRequestTypes,
  onCancelEdit,
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

  const handleRequestTypeChange = (event) => {
    const { options } = event.target;
    const selectedValues = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setNewUserRequestTypes(selectedValues);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-form-container">
        <div className="form-header">
          <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
          {editingUser && (
            <button onClick={onCancelEdit} className="action-button cancel-button">
              Cancel Edit
            </button>
          )}
          <button onClick={onViewUsersClick} className="action-button">
            View All Users
          </button>
        </div>

        <form onSubmit={onUserSubmit}>
          <input className="form-input" type="text" name="username" placeholder="Username" value={newUser.username} onChange={onInputChange} required />
          <input className="form-input" type="password" name="password" placeholder={editingUser ? "New Password (optional)" : "Password"} value={newUser.password} onChange={onInputChange} required={!editingUser} />
          <input className="form-input" type="email" name="email" placeholder="Email" value={newUser.email} onChange={onInputChange} required />
          <select className="form-input" name="role" value={newUser.role} onChange={onInputChange}>
            <option value="USER">User</option>
            <option value="VENDOR">Vendor</option>
            <option value="WORKER">Worker</option>
            <option value="ADMIN">Admin</option>
          </select>

          {(newUser.role === 'VENDOR' || newUser.role === 'WORKER') && (
            <>
              <h3 className="form-section-header">Vendor Services</h3>
              <select
                className="form-input"
                name="requestTypes"
                multiple
                value={newUserRequestTypes}
                onChange={handleRequestTypeChange}
                required
              >
                <option value="" disabled>Select service types (hold Ctrl/Cmd to select multiple)</option>
                {availableRequestTypes.map((type) => (
                  <option key={type.value} value={type.value.toUpperCase().replace(/ /g, '_')}>{type.label}</option>
                ))}
              </select>

              <h3 className="form-section-header">Vendor KYC Details</h3>
              <input className="form-input" type="text" name="name" placeholder="Full Name or Shop Name" value={newUser.name || ''} onChange={onInputChange} required />

              <label htmlFor="digitalSignature">Digital Signature</label>
              <input className="form-input" type="file" name="digitalSignature" id="digitalSignature" onChange={onFileChange} />

              <label htmlFor="adhaarCard">Aadhaar Card</label>
              <input className="form-input" type="file" name="adhaarCard" id="adhaarCard" onChange={onFileChange} />

              <label htmlFor="voterId">Voter ID</label>
              <input className="form-input" type="file" name="voterId" id="voterId" onChange={onFileChange} />

              <label htmlFor="panCard">PAN Card</label>
              <input className="form-input" type="file" name="panCard" id="panCard" onChange={onFileChange} />

              <label htmlFor="shopRegistration">Shop Registration Details</label>
              <input className="form-input" type="file" name="shopRegistration" id="shopRegistration" onChange={onFileChange} />

              <label htmlFor="userAgreement">User Agreement</label>
              <input className="form-input" type="file" name="userAgreement" id="userAgreement" onChange={onFileChange} />
            </>
          )}

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

          <button type="submit" className="submit-button">{editingUser ? 'Update User' : 'Create User'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;