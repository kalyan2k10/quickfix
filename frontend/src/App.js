import React, { useState, useEffect } from 'react';
import './App.css'; 
import AdminDashboard from './AdminDashboard';
import VendorDashboard from './VendorDashboard';
import UserDashboard from './UserDashboard';
import Login from './Login';


function App() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: 'USER' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ problemDescription: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [nearestVendor, setNearestVendor] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [vendorsWithDistances, setVendorsWithDistances] = useState([]);

  const createAuthHeaders = (user, pass) => ({
    'Authorization': 'Basic ' + btoa(`${user}:${pass}`),
    'Content-Type': 'application/json',
  });

  const handleApiError = (err) => {
    console.error('API Error:', err);
    setError(err.message);
  };

  const handleLoginInputChange = (event) => {
    const { name, value } = event.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const authHeaders = createAuthHeaders(credentials.username, credentials.password);

    // Step 1: Fetch the logged-in user's own data
    fetch('/users/me', { headers: authHeaders })
      .then(response => {
        if (!response.ok) throw new Error('Login failed. Check username or password.');
        return response.json();
      })
      .then(currentUser => {
        setLoggedInUser(currentUser);
        setError('');

        // Step 2: Based on role, fetch necessary additional data
        if (currentUser.roles.includes('ADMIN')) {
          // Admin needs the full user list
          fetch('/users', { headers: authHeaders }).then(res => res.json()).then(setUsers);
        } else if (currentUser.roles.includes('USER')) {
          // User needs the list of vendors
          fetch('/users/vendors', { headers: authHeaders }).then(res => res.json()).then(setVendors);
        } else if (currentUser.roles.includes('VENDOR')) {
          // Vendor needs service requests
          fetchServiceRequests(authHeaders);
        }

        if (currentUser.roles.includes('USER')) {
          // Get user's location
          navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const location = { latitude, longitude };
            setUserLocation(location);
            // Update user's location on the backend
            fetch(`/users/${currentUser.id}/location`, {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify(location),
            }).catch(handleApiError);
          }, () => setError("Could not get your location. Please enable location services."));
        }
      })
      .catch(err => {
        handleApiError(err);
        setLoggedInUser(null);
      });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'problemDescription') {
      setNewRequest({ ...newRequest, [name]: value });
    } else {
      setNewUser({ ...newUser, [name]: value });
    }
  };

  const handleUserSubmit = (event) => {
    event.preventDefault();
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
    fetch('/users', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ ...newUser, roles: [newUser.role] }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to create user.');
      return fetch('/users', { headers: authHeaders });
    })
    .then(response => response.json())
    .then(setUsers)
    .catch(handleApiError);
  };

  const fetchServiceRequests = (authHeaders) => {
    fetch('/requests', { headers: authHeaders })
      .then(response => response.json())
      .then(setServiceRequests)
      .catch(handleApiError);
  };

  const handleRequestSubmit = () => {
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);    
    fetch(`/requests`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(newRequest),
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to submit request.');
        return res.json();
    })
    .then(createdRequest => {
        setActiveRequest(createdRequest); // Start tracking the request
        setNewRequest({ problemDescription: '' });
    })
    .catch(handleApiError);
  };

  const handleRequestUpdate = (requestId, status) => {
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
    fetch(`/requests/${requestId}/${status}`, {
      method: 'POST',
      headers: authHeaders,
    })
    .then(res => {
        if (!res.ok) throw new Error(`Failed to ${status} request.`);
        return res.json();
    })
    .then(updatedRequest => {
        // Refresh the list of open requests for the vendor
        fetchServiceRequests(authHeaders);
        // Only show this generic alert on 'accept'
        if (status === 'accept') alert(`Request has been accepted.`);
    })
    .catch(handleApiError);
  };
  const handleUserCompletesRequest = (requestId) => {
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
    fetch(`/requests/${requestId}/complete_by_user`, {
      method: 'POST',
      headers: authHeaders,
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to complete request from user side.');
      return res.json();
    })
    .then(updatedRequest => {
      // Update the state to show the "Service Completed!" screen
      setActiveRequest(updatedRequest);
      // The vendor will see this change on their next poll
    })
    .catch(handleApiError);
  };
  // Effect to calculate nearest vendor, distance, and fare
  useEffect(() => {
    if (userLocation && vendors.length > 0) {
      let closestVendor = null;
      let minDistance = Infinity;
      const allVendorsWithDist = [];

      // Single, reliable getDistance function
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
      };

      vendors.forEach(vendor => {
        if (vendor.latitude && vendor.longitude) {
          const dist = getDistance(userLocation.latitude, userLocation.longitude, vendor.latitude, vendor.longitude);
          allVendorsWithDist.push({ ...vendor, distance: dist });
          if (dist < minDistance) {
            minDistance = dist;
            closestVendor = vendor;
          }
        }
      });

      // Set the state for all vendors for the map
      setVendorsWithDistances(allVendorsWithDist.sort((a, b) => a.distance - b.distance));

      if (closestVendor) {
        setNearestVendor(closestVendor);
        setDistance(minDistance);
        // Calculate fare: base fare of ₹50 + ₹15 per km
        const calculatedFare = 50 + (minDistance * 15);
        setFare(calculatedFare);
      }
    }
  }, [userLocation, vendors]);

  const handleLogout = () => {
    setLoggedInUser(null);
    setCredentials({ username: '', password: '' });
    setUsers([]);
    setServiceRequests([]);
    setError('');
    setUserLocation(null);
    setActiveRequest(null);
  };

  if (!loggedInUser) {
    return (
      <div className="app-container">
        <Login
          onLoginSubmit={handleLoginSubmit}
          onLoginInputChange={handleLoginInputChange}
          credentials={credentials}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>QuickFix Dashboard</h1>
        <div className="welcome-section">
          <p>Welcome, {loggedInUser.username}!</p>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="main-content">
        {error && <p className="error-message">{error}</p>}
        
        {loggedInUser.roles.includes('ADMIN') && <AdminDashboard users={users} newUser={newUser} onInputChange={handleInputChange} onUserSubmit={handleUserSubmit} />}
        {loggedInUser.roles.includes('VENDOR') && <VendorDashboard requests={serviceRequests} onUpdateRequest={handleRequestUpdate} loggedInUser={loggedInUser} authHeaders={createAuthHeaders(loggedInUser.username, credentials.password)} fetchServiceRequests={fetchServiceRequests} />}
        {loggedInUser.roles.includes('USER') && <UserDashboard newRequest={newRequest} onInputChange={handleInputChange} onRequestSubmit={handleRequestSubmit} vendorsWithDistances={vendorsWithDistances} userLocation={userLocation} activeRequest={activeRequest} setActiveRequest={setActiveRequest} authHeaders={createAuthHeaders(loggedInUser.username, credentials.password)} nearestVendor={nearestVendor} fare={fare} distance={distance} onCompleteRequest={handleUserCompletesRequest} />}
      </main>
    </div>
  );
}

export default App;