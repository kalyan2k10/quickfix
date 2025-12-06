package com.innovation.repository;

import com.innovation.model.RequestStatus;
import com.innovation.model.ServiceRequest;
import com.innovation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByStatus(RequestStatus status);

    List<ServiceRequest> findByStatusAndIntendedVendorId(RequestStatus open, Long id);

    List<ServiceRequest> findByRequestingUser(User user);

    List<ServiceRequest> findByAssignedWorker(User worker);

    List<ServiceRequest> findByAssignedVendor(User vendor);

    List<ServiceRequest> findByIntendedVendor(User vendor);
}