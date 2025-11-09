import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";
import './L.Routing.Google.js'; // Import your custom Google router

const RoutingMachine = ({ start, end, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (map && !routingControlRef.current) {
      // Create the routing control only once
      const instance = L.Routing.control({
        router: L.routing.google(), // Use the Google router
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        lineOptions: {
          styles: [{ color: "#007bff", opacity: 0.8, weight: 6 }],
        },
        createMarker: () => null,
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);

      instance.on('routesfound', function (e) {
        // The 'routesfound' event gives us an array of routes.
        // Our custom Google router provides the summary we need.
        if (onRouteFound && e.routes && e.routes.length > 0) {
          // Pass the summary object (containing totalTime and totalDistance) to the dashboard.
          onRouteFound(e.routes[0].summary); 
        }
      });

      routingControlRef.current = instance;
    }
  }, [map, start, end, onRouteFound]);

  useEffect(() => {
    // Update waypoints when start or end points change
    if (routingControlRef.current) {
      routingControlRef.current.setWaypoints([L.latLng(start[0], start[1]), L.latLng(end[0], end[1])]);
    }
  }, [start, end]);

  return null;
};

export default RoutingMachine;