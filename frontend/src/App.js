import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import './App.css'; 
import UserHomepage from './UserHomepage';
import AdminDashboard from './AdminDashboard'; // Assuming you have this component
import VendorDashboard from './VendorDashboard';
import UserList from './UserList';
import UserDashboard from './UserDashboard';
import Login from './Login';


function App() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '' });
  const [signUpFormState, setSignUpFormState] = useState({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [adminAutocomplete, setAdminAutocomplete] = useState(null);
  const [signupAutocomplete, setSignupAutocomplete] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');
  const [adminView, setAdminView] = useState('createUser'); // 'createUser' or 'viewUsers'
  const [userView, setUserView] = useState('homepage'); // 'homepage' or 'dashboard'
  const [newUserRequestTypes, setNewUserRequestTypes] = useState([]); // New state for admin creating user
  const [editingUser, setEditingUser] = useState(null); // State to hold user being edited
  const [serviceRequests, setServiceRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ problemDescription: '', vehicleNumber: '', name: '', email: '', phoneNumber: '', otherProblem: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [nearestVendor, setNearestVendor] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [vendorsWithDistances, setVendorsWithDistances] = useState([]);

  // Use the hook to safely load the map. Since the script is in index.html,
  // we just need to specify the libraries.
  const { isLoaded, loadError } = useJsApiLoader({
    libraries: ['places', 'geometry', 'drawing'],
    preventLoad: true, // Prevent the hook from loading the script again
  });

  // Placed outside the component to ensure it's a stable function reference
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

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

  const handleSignUpInputChange = (event) => {
    const { name, value } = event.target;
    setSignUpFormState({ ...signUpFormState, [name]: value });
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
        // Pre-fill user details in the new request form
        setNewRequest(prev => ({
          ...prev,
          name: currentUser.username,
          email: currentUser.email,
        }));
        setError('');

        // Step 2: Based on role, fetch necessary additional data
        if (currentUser.roles.includes('ADMIN')) {
          // Admin needs the full user list
          setUserView('homepage'); // Reset user view
          fetch('/users', { headers: authHeaders }).then(res => res.json()).then(setUsers);
        } else if (currentUser.roles.includes('USER')) {
          // User needs the list of vendors
          fetch('/users/vendors', { headers: authHeaders }).then(res => res.json()).then(setVendors);
          // Check for any of the user's requests to restore state
          fetch('/requests/my-requests', { headers: authHeaders })
            .then(res => {
              if (res.status === 200) return res.json();
              return []; // No requests found
            })
            .then(myRequests => {
              // Find the most recent request that is not completed
              const latestActiveRequest = myRequests.sort((a, b) => b.id - a.id).find(req => req.status === 'OPEN' || req.status === 'ASSIGNED');
              if (latestActiveRequest) setActiveRequest(latestActiveRequest);
            });
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
            fetch(`/locations/users/${currentUser.id}`, {
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

  const handleUserDashboardInputChange = (event) => {
    const { name, value } = event.target;
    setNewRequest({ ...newRequest, [name]: value });
  };
  const handleAdminDashboardInputChange = (event) => {
    const { name, value } = event.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleUserFormSubmit = (event) => {
    event.preventDefault();
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
    const userPayload = {
      ...newUser,
      roles: [newUser.role],
      requestTypes: newUser.role === 'VENDOR' ? newUserRequestTypes : [],
    };

    let fetchPromise;
    if (editingUser) {
      // Update existing user
      fetchPromise = fetch(`/users/${editingUser.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(userPayload),
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to update user.');
        alert('User updated successfully!');
        setEditingUser(null); // Clear editing state
      });
    } else {
      // Create new user
      fetchPromise = fetch('/users/register', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(userPayload),
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to create user. The username or email might already be taken.');
        alert('User created successfully!');
      });
    }

    fetchPromise.then(() => {
      // Reset form fields and state
      setNewUser({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '' });
      setNewUserRequestTypes([]);
      setAdminView('viewUsers');
      // Re-fetch users to update the list
      return fetch('/users', { headers: authHeaders }); // Re-fetch users
    })
    .then(res => res.json())
    .then(setUsers)
    .catch(handleApiError);
  };

  const handleAdminPlaceChanged = () => {
    if (adminAutocomplete !== null) {
      const place = adminAutocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      // When a place is selected from Autocomplete, update the state.
      const address = place.formatted_address || place.name || '';
      setNewUser(prev => ({ ...prev, address: address, latitude: lat, longitude: lng }));
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const handleSignUpPlaceChanged = () => {
    if (signupAutocomplete !== null) {
      const place = signupAutocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setSignUpFormState(prev => ({ ...prev, address: place.formatted_address, latitude: lat, longitude: lng }));
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const handleSignUpSubmit = (event) => {
    event.preventDefault();
    // Public endpoint for user registration, no auth needed.
    fetch('/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...signUpFormState, roles: [signUpFormState.role] }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Sign up failed. The username or email might already be taken.');
      alert('Sign up successful! Please log in with your new account.');
      // Reset form and maybe switch back to login tab
      setSignUpFormState({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '' });
      // Here you could programmatically switch the tab back to 'login'
    })
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
    let problem = newRequest.problemDescription;
    if (problem === 'Other' && newRequest.otherProblem) {
      problem = newRequest.otherProblem;
    }
    const requestData = { ...newRequest, problemDescription: problem };

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
        setNewRequest({ problemDescription: '', vehicleNumber: '', name: loggedInUser.username, email: loggedInUser.email, phoneNumber: '', otherProblem: '' });
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
      if (!isLoaded) {
        return;
      }

      let closestVendor = null;
      let minDistance = Infinity;
      const allVendorsWithDist = [];

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
  }, [userLocation, vendors, isLoaded]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      password: '', // Password should not be pre-filled for security
      email: user.email,
      role: user.roles.includes('ADMIN') ? 'ADMIN' : (user.roles.includes('VENDOR') ? 'VENDOR' : 'USER'),
      latitude: user.latitude || '',
      longitude: user.longitude || '',
      address: user.address || '',
    });
    setNewUserRequestTypes(user.requestTypes ? Array.from(user.requestTypes) : []);
    setAdminView('createUser'); // Reuse the create user form for editing
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
      fetch(`/users/${userId}`, { method: 'DELETE', headers: authHeaders })
        .then(response => {
          if (!response.ok) throw new Error('Failed to delete user.');
          alert('User deleted successfully.');
          return fetch('/users', { headers: authHeaders }); // Refresh user list
        }).then(res => res.json()).then(setUsers).catch(handleApiError);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCredentials({ username: '', password: '' });
    setUsers([]);
    setServiceRequests([]);
    setError('');
    setUserLocation(null);
    setActiveRequest(null);
    setUserView('homepage');
  };

  if (!loggedInUser) {
    return (
      <div className="app-container">
        <Login
          onLoginSubmit={handleLoginSubmit}
          onLoginInputChange={handleLoginInputChange}
          credentials={credentials}
          onSignUpSubmit={handleSignUpSubmit}
          onSignUpInputChange={handleSignUpInputChange}
          isLoaded={isLoaded}
          onSignupAutocompleteLoad={setSignupAutocomplete}
          onSignUpPlaceChanged={handleSignUpPlaceChanged}
          signUpFormState={signUpFormState}
          setSignUpFormState={setSignUpFormState}
          error={error}
        />
      </div>
    );
  }

  const handleSelectService = (service) => {
    // Set the problem description in the state for the UserDashboard
    setNewRequest(prev => ({ ...prev, problemDescription: service }));
    // Switch to the dashboard view
    setUserView('dashboard');
  };
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="#FF6600"/>
            <path d="M12 9m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" fill="#001f3f"/>
          </svg>
          <h1>ZoomFix</h1>
        </div>
        <nav className="app-nav">
          <a href="#" onClick={(e) => e.preventDefault()}>Home</a>
          <a href="#" onClick={(e) => {e.preventDefault(); alert('Coming Soon!');}}>About</a>
          <a href="#" onClick={(e) => {e.preventDefault(); alert('Coming Soon!');}}>Contact</a>
          <a href="#" onClick={(e) => {e.preventDefault(); alert('Coming Soon!');}}>Help</a>
        </nav>
        <div className="welcome-section">
          <p>Welcome, {loggedInUser.username}!</p>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="main-content">
        {error && <p className="error-message">{error}</p>}
        
        {loggedInUser.roles.includes('ADMIN') && adminView === 'createUser' && (
            <AdminDashboard
              newUser={newUser}
              editingUser={editingUser}
              onInputChange={handleAdminDashboardInputChange}
              onUserSubmit={handleUserFormSubmit}
              isLoaded={isLoaded}
              onAdminAutocompleteLoad={setAdminAutocomplete}
              onAdminPlaceChanged={handleAdminPlaceChanged}
              setNewUser={setNewUser}
              newUserRequestTypes={newUserRequestTypes}
              setNewUserRequestTypes={setNewUserRequestTypes}
              onCancelEdit={() => { setEditingUser(null); setNewUser({ username: '', password: '', email: '', role: 'USER' }); setNewUserRequestTypes([]); setAdminView('viewUsers'); }}
              onViewUsersClick={() => setAdminView('viewUsers')}
            />
        )}
        {loggedInUser.roles.includes('ADMIN') && adminView === 'viewUsers' && (
            <UserList 
              users={users} 
              onShowCreateUser={() => { setEditingUser(null); setAdminView('createUser'); }} 
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
        )}
        {loggedInUser.roles.includes('VENDOR') && <VendorDashboard requests={serviceRequests} onUpdateRequest={handleRequestUpdate} loggedInUser={loggedInUser} authHeaders={createAuthHeaders(loggedInUser.username, credentials.password)} fetchServiceRequests={fetchServiceRequests} isLoaded={isLoaded} loadError={loadError} />}
        {loggedInUser.roles.includes('USER') && userView === 'homepage' && (
          <UserHomepage onGetRescued={() => setUserView('dashboard')} onSelectService={handleSelectService} />
        )}
        {loggedInUser.roles.includes('USER') && userView === 'dashboard' && (
          <UserDashboard newRequest={newRequest} onInputChange={handleUserDashboardInputChange} onRequestSubmit={handleRequestSubmit} vendorsWithDistances={vendorsWithDistances} userLocation={userLocation} activeRequest={activeRequest} setActiveRequest={setActiveRequest} authHeaders={createAuthHeaders(loggedInUser.username, credentials.password)} nearestVendor={nearestVendor} fare={fare} distance={distance} onCompleteRequest={handleUserCompletesRequest} isLoaded={isLoaded} loadError={loadError} onBackToHome={() => setUserView('homepage')} />
        )}
      </main>
    </div>
  );
}

export default App;