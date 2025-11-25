package com.innovation.controller;

import com.innovation.model.User;
import com.innovation.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/locations")
public class LocationController {

    private final UserService userService;

    public LocationController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getUsersByRole(@RequestParam("role") String role) {
        return userService.getUsersByRole(role.toUpperCase());
    }

    @GetMapping("/live")
    public List<User> getLiveLocationsByRole(@RequestParam("role") String role) {
        return userService.getUsersByRole(role.toUpperCase());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUserLocation(@PathVariable Long id, @RequestBody User locationData) {
        return userService.updateUserLocation(id, locationData)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{id}/live")
    public ResponseEntity<User> getLiveUserLocation(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}