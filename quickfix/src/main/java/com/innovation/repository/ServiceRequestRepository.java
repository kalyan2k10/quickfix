package com.innovation.repository;

import com.innovation.model.RequestStatus;
import com.innovation.model.ServiceRequest;
import com.innovation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByStatus(RequestStatus status);

    List<ServiceRequest> findByStatusAndIntendedVendorId(RequestStatus status, Long vendorId);

    List<ServiceRequest> findByRequestingUser(User user);
}