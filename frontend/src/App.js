import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import './App.css'; 
import UserHomepage from './UserHomepage';
import AdminDashboard from './AdminDashboard'; // Assuming you have this component
import VendorDashboard from './VendorDashboard';
import UserList from './UserList';
import UserDashboard from './UserDashboard';
import Login from './Login';
import { availableRequestTypes } from './constants';
import VehicleSelection from './VehicleSelection';


function App() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '', name: '' });
  const [signUpFormState, setSignUpFormState] = useState({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [adminAutocomplete, setAdminAutocomplete] = useState(null);
  const [signupAutocomplete, setSignupAutocomplete] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');
  const [adminView, setAdminView] = useState('createUser'); // 'createUser' or 'viewUsers'
  const [userView, setUserView] = useState('vehicleSelection'); // 'vehicleSelection', 'homepage', or 'dashboard'
  const [newUserRequestTypes, setNewUserRequestTypes] = useState([]); // New state for admin creating user
  const [editingUser, setEditingUser] = useState(null); // State to hold user being edited
  const [newUserFiles, setNewUserFiles] = useState({}); // New state for file uploads
  const [selectedWorkers, setSelectedWorkers] = useState([]); // New state for assigning workers to a vendor
  const [vendorWorkers, setVendorWorkers] = useState([]); // New state for the logged-in vendor's workers
  const [serviceRequests, setServiceRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ problemDescription: '', vehicleNumber: '', name: '', email: '', phoneNumber: '', otherProblem: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [nearestVendor, setNearestVendor] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [vendorsWithDistances, setVendorsWithDistances] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
          setUserView('vehicleSelection'); // Reset user view
          fetch('/users', { headers: authHeaders }).then(res => res.json()).then(setUsers);
        } else if (currentUser.roles.includes('USER')) {
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
          // Vendor also needs the details of their assigned workers
          if (currentUser.workers && currentUser.workers.length > 0) {
            Promise.all(
              currentUser.workers.map(workerId => fetch(`/users/${workerId}`, { headers: authHeaders }).then(res => res.json()))
            ).then(setVendorWorkers)
             .catch(err => console.error("Failed to fetch vendor's workers", err));
          }
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

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (files.length > 0) {
      setNewUserFiles(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleUserFormSubmit = (event) => {
    event.preventDefault();
    const authHeaders = createAuthHeaders(credentials.username, credentials.password);
    const multiPartAuthHeaders = { 'Authorization': authHeaders.Authorization };

    const formData = new FormData();

    const userBlob = new Blob([JSON.stringify({
      ...newUser,
      roles: [newUser.role],
      workers: newUser.role === 'VENDOR' ? selectedWorkers : [],
      requestTypes: (newUser.role === 'VENDOR' || newUser.role === 'WORKER') ? newUserRequestTypes : [],
    })], {
      type: 'application/json'
    });
    formData.append('user', userBlob);

    // Append files
    Object.keys(newUserFiles).forEach(key => {
      if (newUserFiles[key]) {
        formData.append(key, newUserFiles[key]);
      }
    });

    let fetchPromise;
    if (editingUser) {
      // Update existing user
      fetchPromise = fetch(`/users/${editingUser.id}`, {
        method: 'PUT',
        headers: multiPartAuthHeaders,
        body: formData,
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to update user.');
        alert('User updated successfully!');
        setEditingUser(null); // Clear editing state
      });
    } else {
      // Create a new user
      fetchPromise = fetch('/users', { // The endpoint for creating a user
        method: 'POST',
        headers: multiPartAuthHeaders,
        body: formData,
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to create user.');
        alert('User created successfully!');
      });
    }

    fetchPromise.then(() => {
      // Reset form fields and state
      setNewUser({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '', name: '' });
      setNewUserRequestTypes([]);
      setSelectedWorkers([]);
      setAdminView('viewUsers'); // Switch back to the user list
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

  // Function to fetch and update service requests for vendors, for polling
  const refreshServiceRequests = () => {
    if (loggedInUser && loggedInUser.roles.includes('VENDOR')) {
      const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
      fetch('/requests', { headers: authHeaders })
        .then(res => res.json())
        .then(setServiceRequests)
        .catch(err => console.error("Failed to refresh service requests:", err)); // Silently handle errors
    }
  };

  const handleRequestSubmit = () => {
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
    let problem = newRequest.problemDescription;
    if (problem === 'Other' && newRequest.otherProblem) {
      problem = newRequest.otherProblem;
    }
    // As per your request, we will now send the request type in a 'requestTypes' array
    // to be consistent with the rest of the application's logic.
    const requestData = {
      ...newRequest,
      requestTypes: [problem] // The backend should read this and set problemDescription
    };

    fetch(`/requests`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(requestData),
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

  const handleAssignWorkerToRequest = (requestId, workerId) => {
    const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
    fetch(`/requests/${requestId}/assign/${workerId}`, {
      method: 'POST',
      headers: authHeaders,
    })
    .then(res => {
        if (!res.ok) throw new Error(`Failed to assign worker to request.`);
        return res.json();
    })
    .then(updatedRequest => {
        // Refresh the list of open requests for the vendor
        fetchServiceRequests(authHeaders);
        alert(`Worker has been assigned to the request.`);
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
    } else {
      // If there are no vendors, clear the distances list
      setVendorsWithDistances([]);
    }
  }, [userLocation, vendors, isLoaded]);

  // Effect to fetch vendors based on the selected service type
  useEffect(() => {
    if (loggedInUser?.roles.includes('USER') && newRequest.problemDescription) {
      const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
      // Convert UI-friendly name to backend enum-style name
      const requestType = newRequest.problemDescription.toUpperCase().replace(/ /g, '_');

      // Fetch vendors who can handle this request type
      fetch(`/locations/live?role=VENDOR&requestType=${requestType}`, { headers: authHeaders })
        .then(res => {
          if (!res.ok) throw new Error('Could not fetch vendors for this service type.');
          return res.json();
        })
        .then(setVendors) // This will trigger the distance calculation effect
        .catch(handleApiError);
    } else {
      // If no service is selected, or if the user is not a 'USER', clear the vendors list.
      setVendors([]);
    }
  }, [newRequest.problemDescription, loggedInUser]); // Re-run when the problem description changes

  const handleEditUser = (user) => {
    setEditingUser(user);
    setNewUser({
      username: user.username,
      password: '', // Password should not be pre-filled for security
      email: user.email,
      role: user.roles.includes('ADMIN') ? 'ADMIN' : (user.roles.includes('VENDOR') ? 'VENDOR' : (user.roles.includes('WORKER') ? 'WORKER' : 'USER')),
      latitude: user.latitude || '',
      longitude: user.longitude || '',
      address: user.address || '',
      name: user.name || '',
      assignedVendorId: user.assignedVendorId || null,
    });
    setNewUserRequestTypes(user.requestTypes ? Array.from(user.requestTypes) : []);
    setSelectedWorkers(user.workers || []);
    setNewUserFiles({}); // Clear any stale files
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
    setVendorWorkers([]);
    setUserLocation(null);
    setActiveRequest(null);
    setNewRequest({ problemDescription: '', vehicleNumber: '', name: '', email: '', phoneNumber: '', otherProblem: '' }); // Reset the request form
    setUserView('vehicleSelection');
  };

  // Function to fetch and update the user list, to be used for polling
  const refreshUsers = () => {
    if (loggedInUser && loggedInUser.roles.includes('ADMIN')) {
      const authHeaders = createAuthHeaders(loggedInUser.username, credentials.password);
      fetch('/users', { headers: authHeaders })
        .then(res => res.json())
        .then(setUsers)
        .catch(err => console.error("Failed to refresh users:", err)); // Silently handle errors in background
    }
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
    // Find the service object from constants to use its 'value'
    const selectedService = availableRequestTypes.find(s => s.label === service);
    setNewRequest(prev => ({
      ...prev,
      problemDescription: selectedService ? selectedService.value : service,
    }));
    // Switch to the dashboard view
    setUserView('dashboard');
  };

  const handleGoHome = (e) => {
    e.preventDefault();
    setNewRequest({ problemDescription: '', vehicleNumber: '', name: loggedInUser.username, email: loggedInUser.email, phoneNumber: '', otherProblem: '' });
    setUserView('homepage'); // Go back to the services homepage
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    // After selecting a vehicle, we move to the user homepage to select a service.
    setUserView('homepage');
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
          {loggedInUser?.roles.includes('USER') && userView === 'dashboard' && (
            <a href="#" onClick={handleGoHome}>Home</a>
          )}
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
              onCancelEdit={() => { setEditingUser(null); setNewUser({ username: '', password: '', email: '', role: 'USER', latitude: '', longitude: '', address: '', name: '' }); setNewUserRequestTypes([]); setSelectedWorkers([]); setAdminView('viewUsers'); }}
              onViewUsersClick={() => {
                setAdminView('viewUsers');
                // Refresh the user list when switching to the view
                fetch('/users', { headers: createAuthHeaders(loggedInUser.username, credentials.password) }).then(res => res.json()).then(setUsers);
              }}
              onFileChange={handleFileChange}
              allWorkers={users.filter(u =>
                // For the vendor form, show only workers who have chosen this vendor
                u.roles.includes('WORKER') && u.assignedVendorId === editingUser?.id
              )}
              allVendors={users.filter(u => u.roles.includes('VENDOR'))}
              selectedWorkers={selectedWorkers}
              setSelectedWorkers={setSelectedWorkers}
            />
        )}
        {loggedInUser.roles.includes('ADMIN') && adminView === 'viewUsers' && (
            <UserList 
              users={users} 
              onShowCreateUser={() => { setEditingUser(null); setAdminView('createUser'); }} 
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onRefreshUsers={refreshUsers} // Pass the refresh function here
              isLoaded={isLoaded} // Pass the loading status to UserList
              loadError={loadError} // Pass any loading errors to UserList
            />
        )}
        {loggedInUser.roles.includes('VENDOR') && 
            <VendorDashboard 
              requests={serviceRequests} 
              workers={vendorWorkers} 
              onAssignWorker={handleAssignWorkerToRequest} 
              onRefreshRequests={refreshServiceRequests} // Pass the refresh function
            />}
        {loggedInUser.roles.includes('USER') && userView === 'vehicleSelection' && (
          <VehicleSelection onVehicleSelect={handleVehicleSelect} />
        )}
        {loggedInUser.roles.includes('USER') && userView === 'homepage' && selectedVehicle && (
          <UserHomepage onSelectService={handleSelectService} />
        )}
        {loggedInUser.roles.includes('USER') && userView === 'dashboard' && (
          <UserDashboard newRequest={newRequest} onInputChange={handleUserDashboardInputChange} onRequestSubmit={handleRequestSubmit} vendorsWithDistances={vendorsWithDistances} userLocation={userLocation} activeRequest={activeRequest} setActiveRequest={setActiveRequest} authHeaders={createAuthHeaders(loggedInUser.username, credentials.password)} nearestVendor={nearestVendor} fare={fare} distance={distance} onCompleteRequest={handleUserCompletesRequest} isLoaded={isLoaded} loadError={loadError} onBackToHome={() => setUserView('homepage')} />
        )}
      </main>
    </div>
  );
}

export default App;