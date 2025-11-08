import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

const RoutingMachine = ({ start, end, onRouteFound }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (map && !routingControlRef.current) {
      // Create the routing control only once
      const instance = L.Routing.control({
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
        if (onRouteFound) {
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