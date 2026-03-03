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
        // Admin user
        createOrUpdateUser(
                "admin@techcorp.com",
                "Admin@123",
                "Sarah Chen",
                "Compliance Analyst",
                "Nirvahak Inc.",
                "SC");

        // Manager user
        createOrUpdateUser(
                "manager@techcorp.com",
                "Manager@123",
                "James Patel",
                "Risk Manager",
                "Nirvahak Inc.",
                "JP");

        // Analyst user
        createOrUpdateUser(
                "analyst@techcorp.com",
                "Analyst@123",
                "Emily Rodriguez",
                "ANALYST",
                "Nirvahak Inc.",
                "ER");

        log.info("✓ Demo users initialized successfully");
    }

    private void createOrUpdateUser(String email, String rawPassword, String name,
            String role, String organization, String avatar) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Create new user
            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .name(name)
                    .role(role)
                    .organization(organization)
                    .avatar(avatar)
                    .enabled(true)
                    .build();
            userRepository.save(user);
            log.info("✓ Created user: {} ({}) - {}", name, role, email);
        } else {
            // Update existing user to ensure organization and avatar are set
            boolean updated = false;

            if (user.getOrganization() == null || user.getOrganization().isEmpty()) {
                user.setOrganization(organization);
                updated = true;
            }

            if (user.getAvatar() == null || user.getAvatar().isEmpty()) {
                user.setAvatar(avatar);
                updated = true;
            }

            // Update name and role if needed
            if (!name.equals(user.getName())) {
                user.setName(name);
                updated = true;
            }

            if (!role.equals(user.getRole())) {
                user.setRole(role);
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
                log.info("✓ Updated user: {} - added organization and avatar", email);
            } else {
                log.debug("User already exists with all fields: {}", email);
            }
        }
    }
}
