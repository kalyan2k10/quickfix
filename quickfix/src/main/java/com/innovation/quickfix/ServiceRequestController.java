package com.innovation.quickfix;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/requests")
public class ServiceRequestController {

    private final ServiceRequestService requestService;

    public ServiceRequestController(ServiceRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceRequest createRequest(@RequestBody ServiceRequest request,
            @RequestParam(required = false) Long vendorId) {
        return requestService.createRequest(request, vendorId);
    }

    @GetMapping
    public List<ServiceRequest> getOpenRequests() {
        return requestService.getOpenRequests();
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
}