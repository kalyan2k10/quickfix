package com.innovation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users") // Renaming table to avoid conflict with reserved keyword 'user' in some DBs
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String username;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private String email;

    private Double latitude;
    private Double longitude;
    private String address;

    // New fields for Vendor KYC
    private String name; // Full name of the vendor/shop owner

    @Enumerated(EnumType.STRING)
    private UserActivityStatus status = UserActivityStatus.IDLE;

    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] digitalSignature;
    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] adhaarCard;
    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] voterId;
    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] panCard;
    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] shopRegistration;
    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] userAgreement;

    @Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] photo;

    public User() {
    }

    public User(long id, String username, String email) {
        this.username = username;
        this.email = email;
    }

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "roles")
    private Set<String> roles = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_request_types", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "request_type")
    private Set<String> requestTypes = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "vendor_workers", joinColumns = @JoinColumn(name = "vendor_id"))
    @Column(name = "worker_id")
    private Set<Long> workers = new HashSet<>();

    private Long assignedVendorId;

    // Getters and Setters

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Set<String> getRequestTypes() {
        return requestTypes;
    }

    public void setRequestTypes(Set<String> requestTypes) {
        this.requestTypes = requestTypes;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UserActivityStatus getStatus() {
        return status == null ? UserActivityStatus.IDLE : status;
    }

    public void setStatus(UserActivityStatus status) {
        this.status = status;
    }

    public byte[] getDigitalSignature() {
        return digitalSignature;
    }

    public void setDigitalSignature(byte[] digitalSignature) {
        this.digitalSignature = digitalSignature;
    }

    public byte[] getAdhaarCard() {
        return adhaarCard;
    }

    public void setAdhaarCard(byte[] adhaarCard) {
        this.adhaarCard = adhaarCard;
    }

    public byte[] getVoterId() {
        return voterId;
    }

    public void setVoterId(byte[] voterId) {
        this.voterId = voterId;
    }

    public byte[] getPanCard() {
        return panCard;
    }

    public void setPanCard(byte[] panCard) {
        this.panCard = panCard;
    }

    public byte[] getShopRegistration() {
        return shopRegistration;
    }

    public void setShopRegistration(byte[] shopRegistration) {
        this.shopRegistration = shopRegistration;
    }

    public byte[] getUserAgreement() {
        return userAgreement;
    }

    public void setUserAgreement(byte[] userAgreement) {
        this.userAgreement = userAgreement;
    }

    public byte[] getPhoto() {
        return photo;
    }

    public void setPhoto(byte[] photo) {
        this.photo = photo;
    }

    public Set<Long> getWorkers() {
        return workers;
    }

    public void setWorkers(Set<Long> workers) {
        this.workers = workers;
    }

    public Long getAssignedVendorId() {
        return assignedVendorId;
    }

    public void setAssignedVendorId(Long assignedVendorId) {
        this.assignedVendorId = assignedVendorId;
    }

    // --- Transient properties for JSON serialization ---
    // These methods are not stored in the DB but are included in JSON responses.

    @JsonProperty("panCard")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasPanCard() {
        return this.panCard != null && this.panCard.length > 0;
    }

    @JsonProperty("adhaarCard")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasAdhaarCard() {
        return this.adhaarCard != null && this.adhaarCard.length > 0;
    }

    @JsonProperty("digitalSignature")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasDigitalSignature() {
        return this.digitalSignature != null && this.digitalSignature.length > 0;
    }

    @JsonProperty("voterId")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasVoterId() {
        return this.voterId != null && this.voterId.length > 0;
    }

    @JsonProperty("shopRegistration")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasShopRegistration() {
        return this.shopRegistration != null && this.shopRegistration.length > 0;
    }

    @JsonProperty("hasDocuments")
    public boolean hasAnyDocument() {
        return hasPanCard() || hasAdhaarCard() || hasDigitalSignature() || hasVoterId() || hasShopRegistration()
                || hasUserAgreement() || hasPhoto();
    }

    @JsonProperty("userAgreement")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasUserAgreement() {
        return this.userAgreement != null && this.userAgreement.length > 0;
    }

    @JsonProperty("photo")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Boolean hasPhoto() {
        return this.photo != null && this.photo.length > 0;
    }

}