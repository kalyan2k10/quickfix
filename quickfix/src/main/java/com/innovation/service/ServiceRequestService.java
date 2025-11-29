package com.innovation.service;

import com.innovation.model.RequestStatus;
import com.innovation.model.ServiceRequest;
import com.innovation.model.User;
import com.innovation.repository.ServiceRequestRepository;
import com.innovation.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository requestRepository;
    private final UserRepository userRepository;

    public ServiceRequestService(ServiceRequestRepository requestRepository, UserRepository userRepository) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
    }

    public ServiceRequest createRequest(ServiceRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        request.setRequestingUser(user);
        request.setStatus(RequestStatus.OPEN);

        return requestRepository.save(request);
    }

    public List<ServiceRequest> getOpenRequests() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User vendor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        return requestRepository.findByStatus(RequestStatus.OPEN);
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
                    return requestRepository.save(request);
                });
    }

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
                    return requestRepository.save(request);
                });
    }
}