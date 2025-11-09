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
    if (!map) return;

    // Create the routing control
    const instance = L.Routing.control({
      router: L.routing.google(), // Use the Google router
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: "#007bff", opacity: 0.8, weight: 6 }],
      },
      createMarker: () => null,
      show: false,
      addWaypoints: false,
      routeWhileDragging: true, // Allows route to update when waypoints change
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(map);

    // Store the instance in the ref
    routingControlRef.current = instance;

    // Event listener for when a route is found
    instance.on('routesfound', (e) => {
      if (onRouteFound && e.routes && e.routes.length > 0) {
        onRouteFound(e.routes[0].summary);
      }
    });

    // Cleanup function to remove the control when the component unmounts
    return () => {
      if (map && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
    // We want this effect to run ONLY ONCE when the component mounts.
    // The waypoints will be updated in the second effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // This separate effect handles updating the waypoints when start or end locations change.
  useEffect(() => {
    if (routingControlRef.current) {
      routingControlRef.current.setWaypoints([
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ]);
    }
  }, [start, end]);

  return null;
};

export default RoutingMachine;