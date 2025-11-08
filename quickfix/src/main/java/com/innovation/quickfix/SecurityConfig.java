package com.innovation.quickfix;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> userRepository.findByUsername(username)
                .map(user -> new org.springframework.security.core.userdetails.User(
                        user.getUsername(),
                        user.getPassword(),
                        user.getRoles().stream()
                                .map(role -> (org.springframework.security.core.GrantedAuthority) () -> role
                                        .toUpperCase())
                                .collect(Collectors.toList())))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Disabling CSRF for stateless API
                .authorizeHttpRequests(authz -> authz
                        // Admin-specific routes for user management
                        .requestMatchers(HttpMethod.POST, "/users").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/users/{id}").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/users/**").hasAuthority("ADMIN")
                        // User-specific routes
                        .requestMatchers(HttpMethod.POST, "/requests/**").hasAuthority("USER")
                        .requestMatchers(HttpMethod.POST, "/requests/*/complete_by_user").hasAuthority("USER")
                        .requestMatchers(HttpMethod.PUT, "/users/*/location").hasAuthority("USER")
                        // Vendor-specific routes
                        .requestMatchers(HttpMethod.POST, "/requests/*/accept").hasAuthority("VENDOR")
                        .requestMatchers(HttpMethod.POST, "/requests/*/deny").hasAuthority("VENDOR")
                        .requestMatchers(HttpMethod.PUT, "/users/*/live-location").hasAuthority("VENDOR")
                        .requestMatchers(HttpMethod.GET, "/requests").hasAuthority("VENDOR")
                        // Authenticated routes
                        .requestMatchers(HttpMethod.GET, "/users/me").authenticated() // Allow user to fetch their own
                                                                                      // data
                        .requestMatchers(HttpMethod.GET, "/requests/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/users/vendors").authenticated() // Allow fetching vendors
                        .requestMatchers(HttpMethod.GET, "/users").authenticated() // For fetching user/vendor lists
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults()); // Use HTTP Basic Authentication
        return http.build();
    }
}