package com.innovation.quickfix;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

        if (userRepository.findByUsername("user2").isEmpty()) {
            User user2 = new User();
            user2.setUsername("user2");
            user2.setPassword(passwordEncoder.encode("password"));
            user2.setEmail("user2@example.com");
            user2.setRoles(Set.of("USER"));
            userRepository.save(user2);
        }

        if (userRepository.findByUsername("vendor1").isEmpty()) {
            User vendorUser = new User();
            vendorUser.setUsername("vendor1");
            vendorUser.setPassword(passwordEncoder.encode("password"));
            vendorUser.setEmail("vendor1@example.com");
            vendorUser.setRoles(Set.of("VENDOR"));
            vendorUser.setLatitude(12.9293);
            vendorUser.setLongitude(77.5825);
            vendorUser.setAddress("Jayanagar, Bangalore");
            userRepository.save(vendorUser);
        }

        if (userRepository.findByUsername("vendor2").isEmpty()) {
            User vendorUser = new User();
            vendorUser.setUsername("vendor2");
            vendorUser.setPassword(passwordEncoder.encode("password"));
            vendorUser.setEmail("vendor2@example.com");
            vendorUser.setRoles(Set.of("VENDOR"));
            vendorUser.setLatitude(12.9345); // Koramangala
            vendorUser.setLongitude(77.6260);
            vendorUser.setAddress("Koramangala, Bangalore");
            userRepository.save(vendorUser);
        }

        if (userRepository.findByUsername("vendor3").isEmpty()) {
            User vendorUser = new User();
            vendorUser.setUsername("vendor3");
            vendorUser.setPassword(passwordEncoder.encode("password"));
            vendorUser.setEmail("vendor3@example.com");
            vendorUser.setRoles(Set.of("VENDOR"));
            vendorUser.setLatitude(12.9780); // Marathahalli
            vendorUser.setLongitude(77.6990);
            vendorUser.setAddress("Whitefield, Bangalore");
            userRepository.save(vendorUser);
        }
    }
}