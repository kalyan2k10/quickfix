package com.innovation.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String problemDescription;

    private String vehicleNumber;

    private String vehicleType;

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

    @ManyToOne
    @JoinColumn(name = "worker_id")
    private User assignedWorker;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastRoutedAt;

    private String makeModel;

    private String damageDetection;

    private String tireWear;

    private String damageSeverity;

    private String estimatedCostRange;

    @Transient // This field is not persisted in the database
    @JsonProperty("estimatedVehicleAge")
    private String estimatedVehicleAge;

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

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
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

    public User getAssignedWorker() {
        return assignedWorker;
    }

    public void setAssignedWorker(User assignedWorker) {
        this.assignedWorker = assignedWorker;
    }

    public LocalDateTime getLastRoutedAt() {
        return lastRoutedAt;
    }

    public void setLastRoutedAt(LocalDateTime lastRoutedAt) {
        this.lastRoutedAt = lastRoutedAt;
    }

    public String getMakeModel() {
        return makeModel;
    }

    public void setMakeModel(String makeModel) {
        this.makeModel = makeModel;
    }

    public String getDamageDetection() {
        return damageDetection;
    }

    public void setDamageDetection(String damageDetection) {
        this.damageDetection = damageDetection;
    }

    public String getTireWear() {
        return tireWear;
    }

    public void setTireWear(String tireWear) {
        this.tireWear = tireWear;
    }

    public String getDamageSeverity() {
        return damageSeverity;
    }

    public void setDamageSeverity(String damageSeverity) {
        this.damageSeverity = damageSeverity;
    }

    public String getEstimatedCostRange() {
        return estimatedCostRange;
    }

    public void setEstimatedCostRange(String estimatedCostRange) {
        this.estimatedCostRange = estimatedCostRange;
    }

    public String getEstimatedVehicleAge() {
        return estimatedVehicleAge;
    }

    public void setEstimatedVehicleAge(String estimatedVehicleAge) {
        this.estimatedVehicleAge = estimatedVehicleAge;
    }
    // Other getters and setters...
}