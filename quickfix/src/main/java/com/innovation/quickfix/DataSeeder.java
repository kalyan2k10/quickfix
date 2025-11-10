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
            User vendor1 = new User();
            vendor1.setUsername("vendor1");
            vendor1.setPassword(passwordEncoder.encode("password"));
            vendor1.setEmail("vendor1@example.com");
            vendor1.setRoles(Set.of("VENDOR"));
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
            vendor2.setLatitude(12.9345); // Koramangala
            vendor2.setLongitude(77.6260);
            vendor2.setAddress("Koramangala, Bangalore");
            userRepository.save(vendor2);
        }

        if (userRepository.findByUsername("vendor3").isEmpty()) {
            User vendor3 = new User();
            vendor3.setUsername("vendor3");
            vendor3.setPassword(passwordEncoder.encode("password"));
            vendor3.setEmail("vendor3@example.com");
            vendor3.setRoles(Set.of("VENDOR"));
            vendor3.setLatitude(12.9569); // Marathahalli
            vendor3.setLongitude(77.7011);
            vendor3.setAddress("Marathahalli, Bangalore");
            userRepository.save(vendor3);
        }

        if (userRepository.findByUsername("vendor4").isEmpty()) {
            User vendor4 = new User();
            vendor4.setUsername("vendor4");
            vendor4.setPassword(passwordEncoder.encode("password"));
            vendor4.setEmail("vendor4@example.com");
            vendor4.setRoles(Set.of("VENDOR"));
            vendor4.setLatitude(12.9767); // Majestic
            vendor4.setLongitude(77.5713);
            vendor4.setAddress("Majestic, Bangalore");
            userRepository.save(vendor4);
        }
    }
}