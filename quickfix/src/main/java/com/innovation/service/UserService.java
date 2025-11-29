package com.innovation.service;

import com.innovation.model.User;
import com.innovation.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

    public User addUser(User user) {
        if (user.getRoles().contains("VENDOR")
                && (user.getRequestTypes() == null || user.getRequestTypes().isEmpty())) {
            throw new IllegalArgumentException("A vendor must have at least one request type.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> updateUser(Long id, User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(userDetails.getUsername());
                    user.setEmail(userDetails.getEmail());

                    // Update roles
                    if (userDetails.getRoles() != null && !userDetails.getRoles().isEmpty()) {
                        user.setRoles(userDetails.getRoles());
                    }

                    // If the user is a vendor or worker, handle request types
                    if (user.getRoles().contains("VENDOR") || user.getRoles().contains("WORKER")) {
                        if (userDetails.getRequestTypes() == null || userDetails.getRequestTypes().isEmpty()) {
                            if (user.getRoles().contains("VENDOR")) {
                                // For vendors, this is now dynamic, so we can clear it if no workers are
                                // assigned.
                                user.getRequestTypes().clear();
                            } else {
                                throw new IllegalArgumentException("A worker must have at least one request type.");
                            }
                        }
                        user.setRequestTypes(userDetails.getRequestTypes());
                    } else {
                        // If user is not a vendor, clear any existing request types
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

    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Optional<User> updateUserLocation(Long id, User locationData) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setLatitude(locationData.getLatitude());
                    user.setLongitude(locationData.getLongitude());
                    return userRepository.save(user);
                });
    }

    public List<User> getVendorsByRequestType(String requestType) {
        Objects.requireNonNull(requestType, "Request type cannot be null");
        return userRepository.findByRolesContainingAndRequestTypesContaining("VENDOR", requestType);
    }
}