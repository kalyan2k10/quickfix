import L from 'leaflet';

// A wrapper for Google Directions API
// This is necessary because leaflet-routing-machine does not support Google's API out of the box.

// Ensure the google object is available from the Google Maps script
if (!window.google) {
  throw new Error("Google Maps API script is not loaded. Please add it to your index.html.");
}

L.Routing.Google = L.Class.extend({
  initialize: function(options) {
    this._directionsService = new window.google.maps.DirectionsService();
    L.Util.setOptions(this, options);
  },

  route: function(waypoints, callback, context) {
    const travelMode = window.google.maps.TravelMode.DRIVING;

    const request = {
      origin: { lat: waypoints[0].latLng.lat, lng: waypoints[0].latLng.lng },
      destination: { lat: waypoints[waypoints.length - 1].latLng.lat, lng: waypoints[waypoints.length - 1].latLng.lng },
      travelMode: travelMode,
      // This is where we leverage Google's traffic data for more realistic ETAs
      drivingOptions: {
        departureTime: new Date(), // now
        trafficModel: 'bestguess' // or 'pessimistic' or 'optimistic'
      }
    };

    this._directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        // Translate Google's response into the format Leaflet Routing Machine expects
        const routes = this._googleResultToLrm(result);
        callback.call(context, null, routes);
      } else {
        const error = {
          status: status,
          message: `Google Directions API error: ${status}`
        };
        console.error(error);
        callback.call(context, error);
      }
    });

    return this;
  },

  // This function translates the complex Google Directions result into a simpler format
  _googleResultToLrm: function(result) {
    const route = result.routes[0];
    const leg = route.legs[0];

    return [{
      name: route.summary,
      summary: {
        totalDistance: leg.distance.value, // meters
        totalTime: leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value, // seconds
      },
      coordinates: route.overview_path.map(p => L.latLng(p.lat(), p.lng())),
      instructions: [], // Instructions can be mapped here if needed
      waypoints: []
    }];
  }
});

L.routing.google = function(options) {
  return new L.Routing.Google(options);
};