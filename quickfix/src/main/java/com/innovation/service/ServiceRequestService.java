package com.innovation.service;

import com.innovation.model.RequestStatus;
import com.innovation.model.ServiceRequest;
import com.innovation.model.User;
import com.innovation.repository.ServiceRequestRepository;
import com.innovation.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final UserStatusService userStatusService;
    private final UserService userService;

    @Autowired
    public ServiceRequestService(ServiceRequestRepository requestRepository, UserRepository userRepository,
            UserService userService,
            UserStatusService userStatusService) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.userStatusService = userStatusService;
    }

    @Transactional
    public ServiceRequest createRequest(ServiceRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User requestingUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        request.setRequestingUser(requestingUser);
        request.setStatus(RequestStatus.OPEN);

        // --- Find the nearest vendor ---
        findAndSetNearestVendor(request, requestingUser);

        return requestRepository.save(request);
    }

    private void findAndSetNearestVendor(ServiceRequest request, User requestingUser) {
        Double userLat = requestingUser.getLatitude();
        Double userLon = requestingUser.getLongitude();

        if (userLat == null || userLon == null) {
            // Cannot find nearest vendor without user's location.
            // The request will be open to all, which is the old behavior.
            return;
        }

        // Get vendors who can handle this specific request type
        List<User> qualifiedVendors = userService.getVendorsByRequestType(request.getProblemDescription());

        User nearestVendor = null;
        double minDistance = Double.MAX_VALUE;

        for (User vendor : qualifiedVendors) {
            if (vendor.getLatitude() != null && vendor.getLongitude() != null) {
                double distance = haversine(userLat, userLon, vendor.getLatitude(), vendor.getLongitude());
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestVendor = vendor;
                }
            }
        }

        if (nearestVendor != null) {
            request.setIntendedVendor(nearestVendor);
        }
    }

    // Haversine formula to calculate distance between two lat/lon points in km
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Radius of the Earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<ServiceRequest> getOpenRequests() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User vendor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        // Return requests that are OPEN and intended for this specific vendor
        return requestRepository.findByStatusAndIntendedVendorId(RequestStatus.OPEN, vendor.getId());
    }

    public List<ServiceRequest> getMyRequests() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return requestRepository.findByRequestingUser(user);
    }

    public Optional<ServiceRequest> getRequestById(Long id) {
        return requestRepository.findById(id);
    }

    public Optional<ServiceRequest> updateRequestStatus(Long requestId, String status) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User vendor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        return requestRepository.findById(requestId)
                .map(request -> {
                    switch (status.toLowerCase()) {
                        case "accept": {
                            if (request.getStatus() != RequestStatus.OPEN) {
                                throw new IllegalStateException("Request is not open for assignment.");
                            }
                            request.setAssignedVendor(vendor);
                            request.setStatus(RequestStatus.ASSIGNED);
                            break;
                        }
                        case "deny": {
                            // This case can be expanded later if needed.
                            // For now, we'll just handle accept.
                            break;
                        }
                        default:
                            throw new IllegalArgumentException("Invalid status: " + status);
                    }
                    return requestRepository.save(request);
                });
    }

    @Transactional
    public Optional<ServiceRequest> completeRequestByUser(Long requestId) {
        // Get the currently authenticated user
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return requestRepository.findById(requestId)
                .map(request -> {
                    // Ensure the request is assigned and the user completing it is the one who
                    // requested it
                    if (request.getStatus() != RequestStatus.ASSIGNED ||
                            request.getRequestingUser().getId() != user.getId()) {
                        throw new IllegalStateException("Request cannot be completed by this user at this time.");
                    }
                    request.setStatus(RequestStatus.COMPLETED);

                    // --- Update User and Worker Statuses to COMPLETED ---
                    userStatusService.transitionToCompleted(request.getRequestingUser(), request.getAssignedWorker());

                    return requestRepository.save(request);
                });
    }

    @Transactional
    public Optional<ServiceRequest> assignWorkerToRequest(Long requestId, Long workerId) {
        // Get the currently authenticated vendor
        String vendorUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User vendor = userRepository.findByUsername(vendorUsername)
                .orElseThrow(() -> new IllegalStateException("Current user is not a valid vendor."));

        // Find the worker to be assigned
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker with ID " + workerId + " not found."));

        // Find the request
        return requestRepository.findById(requestId)
                .map(request -> {
                    // --- Validation Checks ---
                    // 1. Ensure the request is open
                    if (request.getStatus() != RequestStatus.OPEN) {
                        throw new IllegalStateException("Request is not open for assignment.");
                    }
                    // 2. Ensure the worker belongs to the vendor
                    if (!vendor.getWorkers().contains(worker.getId())) {
                        throw new IllegalStateException("This worker is not assigned to your account.");
                    }
                    // 3. Ensure the worker is qualified for the job
                    if (!worker.getRequestTypes().contains(request.getProblemDescription())) {
                        throw new IllegalStateException(
                                "This worker is not qualified for the service: " + request.getProblemDescription());
                    }

                    request.setAssignedVendor(vendor);
                    request.setAssignedWorker(worker); // You will need to add this field to your ServiceRequest model
                    request.setStatus(RequestStatus.ASSIGNED);

                    // --- Update User and Worker Statuses ---
                    userStatusService.transitionToAssigned(request.getRequestingUser(), worker);

                    return requestRepository.save(request);
                });
    }
}