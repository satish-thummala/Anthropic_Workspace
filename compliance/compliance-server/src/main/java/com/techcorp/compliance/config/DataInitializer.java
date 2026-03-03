package com.techcorp.compliance.config;

import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser(
                "admin@techcorp.com",
                "Admin@123",
                "Sarah Chen",
                "Compliance Analyst",
                "Nirvahak Inc.",
                "SC");
        seedUser(
                "manager@techcorp.com",
                "Manager@123",
                "James Patel",
                "Risk Manager",
                "Nirvahak Inc.",
                "JP");
        log.info("Demo users seeded successfully");
    }

    private void seedUser(String email, String rawPassword, String name,
            String role, String org, String avatar) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .name(name)
                    .role(role)
                    .organization(org)
                    .avatar(avatar)
                    .enabled(true)
                    .build();
            userRepository.save(user);
            log.info("Created user: {}", email);
        } else {
            log.debug("User already exists: {}", email);
        }
    }
}
