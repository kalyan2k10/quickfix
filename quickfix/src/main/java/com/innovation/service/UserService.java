package com.innovation.service;

import com.innovation.model.User;
import com.innovation.model.UserActivityStatus;
import com.innovation.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserStatusService userStatusService; // Inject UserStatusService

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            UserStatusService userStatusService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userStatusService = userStatusService;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getVendors() {
        return userRepository.findByRolesContaining("VENDOR");
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRolesContaining(role);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public User addUser(User user) {
        // If the user is a VENDOR, derive their request types from their assigned
        // workers.
        if (user.getRoles().contains("VENDOR")) {
            Set<String> derivedRequestTypes = deriveRequestTypesFromWorkers(user.getWorkers());
            user.setRequestTypes(derivedRequestTypes);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public Optional<User> updateUser(Long id, User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    // The original roles of the user before any updates
                    Set<String> originalRoles = new HashSet<>(user.getRoles());

                    user.setUsername(userDetails.getUsername());
                    user.setEmail(userDetails.getEmail());

                    // Update roles
                    if (userDetails.getRoles() != null && !userDetails.getRoles().isEmpty()) {
                        user.setRoles(userDetails.getRoles());
                    }

                    // If the user is a VENDOR, update their assigned workers and derive request
                    // types
                    if (user.getRoles().contains("VENDOR")) {
                        user.setWorkers(userDetails.getWorkers());
                        Set<String> derivedRequestTypes = deriveRequestTypesFromWorkers(user.getWorkers());
                        user.setRequestTypes(derivedRequestTypes);
                    }
                    // If the user is a WORKER, update their request types from the payload
                    else if (user.getRoles().contains("WORKER")) {
                        // Update which vendor this worker is assigned to
                        user.setAssignedVendorId(userDetails.getAssignedVendorId());
                        user.setRequestTypes(userDetails.getRequestTypes());
                    }
                    // If the user is neither a VENDOR nor a WORKER, clear their request types
                    else {
                        user.getRequestTypes().clear();
                    }

                    // Update Vendor KYC details
                    user.setName(userDetails.getName()); // Always update name

                    // Only update document if a new one is provided in the request
                    if (userDetails.getDigitalSignature() != null) {
                        user.setDigitalSignature(userDetails.getDigitalSignature());
                    }
                    if (userDetails.getAdhaarCard() != null) {
                        user.setAdhaarCard(userDetails.getAdhaarCard());
                    }
                    if (userDetails.getVoterId() != null) {
                        user.setVoterId(userDetails.getVoterId());
                    }
                    if (userDetails.getPanCard() != null) {
                        user.setPanCard(userDetails.getPanCard());
                    }
                    // Note: shopRegistration is missing from the controller, but we'll add the
                    // logic here
                    if (userDetails.getShopRegistration() != null) {
                        user.setShopRegistration(userDetails.getShopRegistration());
                    }
                    if (userDetails.getUserAgreement() != null) {
                        user.setUserAgreement(userDetails.getUserAgreement());
                    }

                    // Update location
                    user.setAddress(userDetails.getAddress());
                    user.setLatitude(userDetails.getLatitude());
                    user.setLongitude(userDetails.getLongitude());

                    // Update password only if a new one is provided
                    if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
                    }

                    return userRepository.save(user);
                });
    }

    private Set<String> deriveRequestTypesFromWorkers(Set<Long> workerIds) {
        if (workerIds == null || workerIds.isEmpty()) {
            return new HashSet<>();
        }
        List<User> workers = userRepository.findAllById(workerIds);
        return workers.stream()
                .flatMap(worker -> worker.getRequestTypes().stream())
                .collect(Collectors.toSet());
    }

    @Transactional
    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Optional<User> updateUserLocation(Long id, User locationData) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setLatitude(locationData.getLatitude());
                    user.setLongitude(locationData.getLongitude());
                    return userRepository.save(user);
                });
    }

    @Transactional
    public void updateUserStatus(Long userId, UserActivityStatus status) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(status);
            userRepository.save(user);
        });
    }

    public List<User> getVendorsByRequestType(String requestType) {
        Objects.requireNonNull(requestType, "Request type cannot be null");
        return userRepository.findByRolesContainingAndRequestTypesContaining("VENDOR", requestType);
    }
}