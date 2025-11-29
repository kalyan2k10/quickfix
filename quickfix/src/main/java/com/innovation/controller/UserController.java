package com.innovation.controller;

import com.innovation.model.User;
import com.innovation.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<User> getLoggedInUser(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        return userService.getUserByUsername(principal.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/vendors")
    public List<User> getVendors() {
        return userService.getVendors();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public User addUser(@RequestBody User user) {
        return userService.addUser(user);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User registerUser(@RequestBody User user) {
        return userService.addUser(user);
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestPart("user") User user,
            @RequestPart(value = "panCard", required = false) MultipartFile panCard,
            @RequestPart(value = "digitalSignature", required = false) MultipartFile digitalSignature,
            @RequestPart(value = "adhaarCard", required = false) MultipartFile adhaarCard,
            @RequestPart(value = "voterId", required = false) MultipartFile voterId,
            @RequestPart(value = "shopRegistration", required = false) MultipartFile shopRegistration,
            @RequestPart(value = "userAgreement", required = false) MultipartFile userAgreement)
            throws IOException {

        // Manually set the byte[] data on the user object from the MultipartFile
        if (panCard != null && !panCard.isEmpty()) {
            user.setPanCard(panCard.getBytes());
        }
        if (digitalSignature != null && !digitalSignature.isEmpty()) {
            user.setDigitalSignature(digitalSignature.getBytes());
        }
        if (adhaarCard != null && !adhaarCard.isEmpty()) {
            user.setAdhaarCard(adhaarCard.getBytes());
        }
        if (voterId != null && !voterId.isEmpty()) {
            user.setVoterId(voterId.getBytes());
        }
        if (shopRegistration != null && !shopRegistration.isEmpty()) {
            user.setShopRegistration(shopRegistration.getBytes());
        }
        if (userAgreement != null && !userAgreement.isEmpty()) {
            user.setUserAgreement(userAgreement.getBytes());
        }

        return userService.updateUser(id, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.deleteUser(id)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/documents/{docType}")
    public ResponseEntity<byte[]> getDocument(@PathVariable Long id, @PathVariable String docType) {
        User user = userService.getUserById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] documentData;
        String filename = docType + ".pdf"; // Default filename

        switch (docType.toLowerCase()) {
            case "pancard":
                documentData = user.getPanCard();
                break;
            case "adhaarcard":
                documentData = user.getAdhaarCard();
                break;
            case "digitalsignature":
                documentData = user.getDigitalSignature();
                break;
            case "voterid":
                documentData = user.getVoterId();
                break;
            case "shopregistration":
                documentData = user.getShopRegistration();
                break;
            case "useragreement":
                documentData = user.getUserAgreement();
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        if (documentData == null || documentData.length == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(documentData);
    }
}