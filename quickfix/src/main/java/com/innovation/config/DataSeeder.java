package com.innovation.config;

import com.innovation.model.RequestStatus;
import com.innovation.model.ServiceRequest;
import com.innovation.model.User;
import com.innovation.repository.ServiceRequestRepository;
import com.innovation.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.Collections;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ServiceRequestRepository serviceRequestRepository;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder,
            ServiceRequestRepository serviceRequestRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("password"));
            adminUser.setEmail("admin@example.com");
            adminUser.setRoles(Set.of("ADMIN"));
            userRepository.save(adminUser);
        }

        if (userRepository.findByUsername("kalyan").isEmpty()) {
            User kalyanUser = new User();
            kalyanUser.setUsername("kalyan");
            kalyanUser.setPassword(passwordEncoder.encode("password"));
            kalyanUser.setEmail("kalyan@example.com");
            kalyanUser.setRoles(Set.of("USER"));
            kalyanUser.setLatitude(12.9719);
            kalyanUser.setLongitude(77.6412);
            kalyanUser.setAddress("Indiranagar, Bangalore");
            userRepository.save(kalyanUser);
        }
    }
}