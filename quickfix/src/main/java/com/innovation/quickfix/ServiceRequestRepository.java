package com.innovation.quickfix;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByStatus(RequestStatus status);

    List<ServiceRequest> findByStatusAndIntendedVendorId(RequestStatus status, Long vendorId);
}