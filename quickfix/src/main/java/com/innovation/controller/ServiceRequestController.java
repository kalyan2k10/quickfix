package com.innovation.controller;

import com.innovation.model.ServiceRequest;
import com.innovation.service.ServiceRequestService;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/requests")
public class ServiceRequestController {

    private final ServiceRequestService requestService;

    public ServiceRequestController(ServiceRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceRequest createRequest(
            @RequestPart("request") ServiceRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return requestService.createRequest(request, image);
    }

    @GetMapping
    public List<ServiceRequest> getOpenRequests() {
        return requestService.getOpenRequests();
    }

    @GetMapping("/my-requests")
    public List<ServiceRequest> getMyRequests() {
        return requestService.getMyRequests();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequest> getRequestById(@PathVariable Long id) {
        return requestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/{status}")
    public ResponseEntity<ServiceRequest> updateRequestStatus(@PathVariable Long id, @PathVariable String status) {
        return requestService.updateRequestStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/complete_by_user")
    public ResponseEntity<ServiceRequest> completeRequestByUser(@PathVariable Long id) {
        return requestService.completeRequestByUser(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{requestId}/assign/{workerId}")
    public ResponseEntity<ServiceRequest> assignWorkerToRequest(@PathVariable Long requestId,
            @PathVariable Long workerId) {
        return requestService.assignWorkerToRequest(requestId, workerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}