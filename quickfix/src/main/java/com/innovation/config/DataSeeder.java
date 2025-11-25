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

        if (userRepository.findByUsername("vendor1").isEmpty()) {
            User vendor1 = new User();
            vendor1.setUsername("vendor1");
            vendor1.setPassword(passwordEncoder.encode("password"));
            vendor1.setEmail("vendor1@example.com");
            vendor1.setRoles(Set.of("VENDOR"));
            vendor1.setRequestTypes(Set.of("BATTERY_JUMPSTART", "TOWING"));
            vendor1.setLatitude(12.9293); // Jayanagar
            vendor1.setLongitude(77.5825);
            vendor1.setAddress("Jayanagar, Bangalore");
            userRepository.save(vendor1);
        }

        if (userRepository.findByUsername("vendor2").isEmpty()) {
            User vendor2 = new User();
            vendor2.setUsername("vendor2");
            vendor2.setPassword(passwordEncoder.encode("password"));
            vendor2.setEmail("vendor2@example.com");
            vendor2.setRoles(Set.of("VENDOR"));
            vendor2.setRequestTypes(Set.of("BATTERY_JUMPSTART", "TOWING"));
            vendor2.setLatitude(12.9345); // Koramangala
            vendor2.setLongitude(77.6260);
            vendor2.setAddress("Koramangala, Bangalore");
            userRepository.save(vendor2);
        }
    }
}