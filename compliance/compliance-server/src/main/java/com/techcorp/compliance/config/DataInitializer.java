package com.techcorp.compliance.config;

import com.techcorp.compliance.entity.Control;
import com.techcorp.compliance.entity.Control.Severity;
import com.techcorp.compliance.entity.Framework;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.ControlRepository;
import com.techcorp.compliance.repository.FrameworkRepository;
import com.techcorp.compliance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository      userRepo;
    private final PasswordEncoder     passwordEncoder;
    private final FrameworkRepository frameworkRepo;
    private final ControlRepository   controlRepo;

    @Override
    @Transactional
    public void run(String... args) {
        seedUsers();
        seedFrameworks();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────────────────────────────────

    private void seedUsers() {
        seedUser("admin@techcorp.com",   "Admin@123",   "Sarah Chen",      "Compliance Analyst", "Nirvahak Inc.", "SC");
        seedUser("manager@techcorp.com", "Manager@123", "James Patel",     "Risk Manager",       "Nirvahak Inc.", "JP");
        seedUser("analyst@techcorp.com",   "Analyst@123",  "Emily Rodriguez", "Analyst",  "Nirvahak Inc.", "ER");
        // Employee accounts
        seedUser("employee1@techcorp.com", "Employee@123", "Alex Turner",    "Employee", "Nirvahak Inc.", "AT");
        seedUser("employee2@techcorp.com", "Employee@123", "Priya Sharma",   "Employee", "Nirvahak Inc.", "PS");
        seedUser("employee3@techcorp.com", "Employee@123", "Marcus Johnson", "Employee", "Nirvahak Inc.", "MJ");
        log.info("✓ Users ready (including 3 employee accounts)");
    }

    private void seedUser(String email, String rawPwd, String name,
                          String role, String org, String avatar) {
        User u = userRepo.findByEmail(email).orElse(null);
        if (u == null) {
            userRepo.save(User.builder()
                    .email(email).password(passwordEncoder.encode(rawPwd))
                    .name(name).role(role).organization(org).avatar(avatar).enabled(true)
                    .build());
            log.info("  Created user: {}", email);
        } else {
            // Always re-encode password to prevent stale hashes after DB reinstall
            u.setPassword(passwordEncoder.encode(rawPwd));
            u.setName(name); u.setRole(role); u.setOrganization(org); u.setAvatar(avatar);
            userRepo.save(u);
            log.info("  Updated user: {}", email);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FRAMEWORKS  (skipped if already seeded)
    // ─────────────────────────────────────────────────────────────────────────

    private void seedFrameworks() {
        if (frameworkRepo.count() > 0) {
            log.info("✓ Frameworks already seeded — skipping");
            return;
        }

        seedISO27001();
        seedSOC2();
        seedGDPR();
        seedHIPAA();

        // Refresh coverage counters on each framework
        frameworkRepo.findAll().forEach(fw -> {
            fw.setTotalControls((int)   controlRepo.countByFrameworkId(fw.getId()));
            fw.setCoveredControls((int) controlRepo.countByFrameworkIdAndIsCoveredTrue(fw.getId()));
            frameworkRepo.save(fw);
        });

        log.info("✓ Frameworks and controls seeded");
    }

    // ── ISO 27001 ─────────────────────────────────────────────────────────────
    private void seedISO27001() {
        Framework fw = saveFw("ISO27001", "ISO/IEC 27001", "2022",
                "Information Security Management System standard for establishing, " +
                "implementing, maintaining and improving an ISMS",
                "#3B82F6", "Technology", LocalDate.of(2022, 10, 25));

        saveCtrl(fw, "A.5.1",  "Policies for Information Security",           "Organizational Controls", Severity.HIGH,     true,  1);
        saveCtrl(fw, "A.5.2",  "Information Security Roles & Responsibilities","Organizational Controls", Severity.HIGH,     true,  2);
        saveCtrl(fw, "A.5.3",  "Segregation of Duties",                       "Organizational Controls", Severity.CRITICAL, false, 3);
        saveCtrl(fw, "A.6.1",  "Screening",                                   "People Controls",         Severity.HIGH,     true,  4);
        saveCtrl(fw, "A.6.2",  "Terms and Conditions of Employment",          "People Controls",         Severity.MEDIUM,   true,  5);
        saveCtrl(fw, "A.6.3",  "Security Awareness & Training",               "People Controls",         Severity.HIGH,     true,  6);
        saveCtrl(fw, "A.6.4",  "Disciplinary Process",                        "People Controls",         Severity.MEDIUM,   false, 7);
        saveCtrl(fw, "A.7.1",  "Physical Security Perimeters",                "Physical Controls",       Severity.HIGH,     true,  8);
        saveCtrl(fw, "A.7.2",  "Physical Entry Controls",                     "Physical Controls",       Severity.HIGH,     true,  9);
        saveCtrl(fw, "A.7.3",  "Securing Offices, Rooms and Facilities",      "Physical Controls",       Severity.MEDIUM,   false, 10);
        saveCtrl(fw, "A.8.1",  "User Endpoint Devices",                       "Technological Controls",  Severity.CRITICAL, true,  11);
        saveCtrl(fw, "A.8.2",  "Privileged Access Rights",                    "Technological Controls",  Severity.CRITICAL, true,  12);
        saveCtrl(fw, "A.8.3",  "Information Access Restriction",              "Technological Controls",  Severity.HIGH,     true,  13);
        saveCtrl(fw, "A.8.4",  "Access to Source Code",                       "Technological Controls",  Severity.HIGH,     false, 14);
        saveCtrl(fw, "A.8.5",  "Secure Authentication",                       "Technological Controls",  Severity.CRITICAL, true,  15);
        saveCtrl(fw, "A.8.12", "Data Leakage Prevention",                     "Technological Controls",  Severity.HIGH,     false, 16);
        saveCtrl(fw, "A.9.4.2","Secure Log-on Procedures",                    "Technological Controls",  Severity.MEDIUM,   true,  17);
    }

    // ── SOC 2 ─────────────────────────────────────────────────────────────────
    private void seedSOC2() {
        Framework fw = saveFw("SOC2", "SOC 2 Type II", "2017",
                "Service Organization Control framework for managing customer data " +
                "based on five trust service principles",
                "#8B5CF6", "Technology", LocalDate.of(2017, 5, 1));

        saveCtrl(fw, "CC1.1", "Control Environment — Integrity and Ethics", "Common Criteria", Severity.HIGH,     true,  1);
        saveCtrl(fw, "CC1.2", "Board Independence and Oversight",           "Common Criteria", Severity.MEDIUM,   true,  2);
        saveCtrl(fw, "CC2.1", "Risk Assessment Process",                    "Common Criteria", Severity.HIGH,     false, 3);
        saveCtrl(fw, "CC3.1", "Policies and Procedures Established",        "Common Criteria", Severity.MEDIUM,   true,  4);
        saveCtrl(fw, "CC6.1", "Logical and Physical Access Controls",       "Common Criteria", Severity.CRITICAL, true,  5);
        saveCtrl(fw, "CC6.6", "Logical Access Security Measures",           "Common Criteria", Severity.CRITICAL, false, 6);
        saveCtrl(fw, "CC7.2", "System Monitoring",                          "Common Criteria", Severity.HIGH,     true,  7);
        saveCtrl(fw, "A1.1",  "Availability — Continuity Planning",         "Availability",    Severity.HIGH,     true,  8);
        saveCtrl(fw, "PI1.1", "Processing Integrity — Accuracy",            "Processing",      Severity.MEDIUM,   false, 9);
        saveCtrl(fw, "C1.1",  "Confidentiality of Information",             "Confidentiality", Severity.HIGH,     true,  10);
    }

    // ── GDPR ──────────────────────────────────────────────────────────────────
    private void seedGDPR() {
        Framework fw = saveFw("GDPR", "General Data Protection Regulation", "2018",
                "EU regulation on data protection and privacy for all individuals " +
                "within the European Union and EEA",
                "#10B981", "All Industries", LocalDate.of(2018, 5, 25));

        saveCtrl(fw, "Art.5",  "Principles Relating to Processing",        "General Provisions",     Severity.CRITICAL, true,  1);
        saveCtrl(fw, "Art.6",  "Lawfulness of Processing",                 "General Provisions",     Severity.CRITICAL, true,  2);
        saveCtrl(fw, "Art.15", "Right of Access",                          "Rights of Data Subject", Severity.HIGH,     true,  3);
        saveCtrl(fw, "Art.17", "Right to Erasure (Right to be Forgotten)", "Rights of Data Subject", Severity.HIGH,     true,  4);
        saveCtrl(fw, "Art.25", "Data Protection by Design and Default",    "Controller/Processor",   Severity.HIGH,     false, 5);
        saveCtrl(fw, "Art.28", "Processor Requirements",                   "Controller/Processor",   Severity.HIGH,     true,  6);
        saveCtrl(fw, "Art.30", "Records of Processing Activities",         "Controller/Processor",   Severity.LOW,      false, 7);
        saveCtrl(fw, "Art.32", "Security of Processing",                   "Controller/Processor",   Severity.CRITICAL, true,  8);
        saveCtrl(fw, "Art.33", "Notification of Data Breach to Authority", "Controller/Processor",   Severity.CRITICAL, true,  9);
        saveCtrl(fw, "Art.35", "Data Protection Impact Assessment",        "Controller/Processor",   Severity.HIGH,     true,  10);
    }

    // ── HIPAA ─────────────────────────────────────────────────────────────────
    private void seedHIPAA() {
        Framework fw = saveFw("HIPAA", "HIPAA Security Rule", "2013",
                "Health Insurance Portability and Accountability Act — safeguards " +
                "for protecting electronic protected health information",
                "#F59E0B", "Healthcare", LocalDate.of(2013, 9, 23));

        saveCtrl(fw, "164.308(a)(1)", "Security Management Process",      "Administrative Safeguards", Severity.CRITICAL, false, 1);
        saveCtrl(fw, "164.308(a)(3)", "Workforce Security",               "Administrative Safeguards", Severity.HIGH,     true,  2);
        saveCtrl(fw, "164.308(a)(4)", "Information Access Management",    "Administrative Safeguards", Severity.HIGH,     false, 3);
        saveCtrl(fw, "164.308(a)(5)", "Security Awareness and Training",  "Administrative Safeguards", Severity.HIGH,     true,  4);
        saveCtrl(fw, "164.310(a)(1)", "Facility Access Controls",         "Physical Safeguards",       Severity.HIGH,     true,  5);
        saveCtrl(fw, "164.310(d)(1)", "Device and Media Controls",        "Physical Safeguards",       Severity.MEDIUM,   true,  6);
        saveCtrl(fw, "164.312(a)(1)", "Access Control",                   "Technical Safeguards",      Severity.CRITICAL, false, 7);
        saveCtrl(fw, "164.312(b)",    "Audit Controls",                   "Technical Safeguards",      Severity.HIGH,     true,  8);
        saveCtrl(fw, "164.312(c)(1)", "Integrity Controls",               "Technical Safeguards",      Severity.HIGH,     false, 9);
        saveCtrl(fw, "164.312(e)(1)", "Transmission Security",            "Technical Safeguards",      Severity.CRITICAL, true,  10);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private Framework saveFw(String code, String name, String version,
                             String desc, String color, String industry, LocalDate published) {
        return frameworkRepo.save(Framework.builder()
                .code(code).name(name).version(version).description(desc)
                .color(color).industry(industry).publishedDate(published)
                .build());
    }

    private void saveCtrl(Framework fw, String code, String title,
                          String category, Severity severity, boolean covered, int order) {
        controlRepo.save(Control.builder()
                .framework(fw).code(code).title(title)
                .category(category).severity(severity)
                .isCovered(covered).displayOrder(order)
                .build());
    }
}
