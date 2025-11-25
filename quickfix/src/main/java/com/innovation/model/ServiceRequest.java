package com.innovation.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String problemDescription;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private User requestingUser;

    @ManyToOne
    @JoinColumn(name = "vendor_id")
    private User assignedVendor;

    @ManyToOne
    @JoinColumn(name = "intended_vendor_id")
    private User intendedVendor;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProblemDescription() {
        return problemDescription;
    }

    public void setProblemDescription(String problemDescription) {
        this.problemDescription = problemDescription;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public User getRequestingUser() {
        return requestingUser;
    }

    public void setRequestingUser(User requestingUser) {
        this.requestingUser = requestingUser;
    }

    public User getAssignedVendor() {
        return assignedVendor;
    }

    public void setAssignedVendor(User assignedVendor) {
        this.assignedVendor = assignedVendor;
    }

    public User getIntendedVendor() {
        return intendedVendor;
    }

    public void setIntendedVendor(User intendedVendor) {
        this.intendedVendor = intendedVendor;
    }

    // Other getters and setters...
}