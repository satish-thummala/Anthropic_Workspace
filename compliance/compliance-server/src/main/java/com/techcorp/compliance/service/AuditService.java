package com.techcorp.compliance.service;

import com.techcorp.compliance.entity.AuditLog;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.entity.AuditLog.Outcome;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.AuditLogRepository;
import com.techcorp.compliance.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * AuditService
 *
 * Central service for writing and querying the audit trail.
 *
 * IMPORTANT: log() uses Propagation.REQUIRES_NEW so that an audit record
 * is always written — even if the calling transaction rolls back.
 * This ensures failures are recorded, not silently dropped.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditRepo;
    private final UserRepository     userRepo;

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * Main log method — called from controllers and services.
     * Runs in its own transaction so audit records survive rollbacks.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Action action,
                    String entityType,
                    String entityId,
                    String entityName,
                    String description) {
        logInternal(action, entityType, entityId, entityName,
                description, null, null, Outcome.SUCCESS, null);
    }

    /** Log with old/new values — for status changes and updates */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logChange(Action action,
                          String entityType,
                          String entityId,
                          String entityName,
                          String description,
                          String oldValue,
                          String newValue) {
        logInternal(action, entityType, entityId, entityName,
                description, oldValue, newValue, Outcome.SUCCESS, null);
    }

    /** Log a failure */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(Action action,
                           String entityType,
                           String entityId,
                           String entityName,
                           String description,
                           String errorMessage) {
        logInternal(action, entityType, entityId, entityName,
                description, null, null, Outcome.FAILURE, errorMessage);
    }

    /**
     * Log an event with an explicitly provided user email.
     * Use this for login/logout where the SecurityContext may not yet
     * have the authenticated user set (e.g. during login processing).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logForUser(String explicitEmail,
                           Action action,
                           String entityType,
                           String entityId,
                           String entityName,
                           String description) {
        try {
            String userName  = resolveUserName(explicitEmail);
            String ipAddress = resolveIpAddress();

            AuditLog entry = AuditLog.builder()
                    .userEmail(explicitEmail)
                    .userName(userName)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .description(description)
                    .outcome(Outcome.SUCCESS)
                    .ipAddress(ipAddress)
                    .build();

            auditRepo.save(entry);
        } catch (Exception e) {
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogs(String userEmail, String action, String entityType,
                                   String from, String to, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));

        Action actionEnum = null;
        if (action != null && !action.isBlank()) {
            try { actionEnum = Action.valueOf(action.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        LocalDateTime fromDt = parseDate(from, LocalDateTime.now().minusDays(30));
        LocalDateTime toDt   = parseDate(to,   LocalDateTime.now().plusDays(1));

        String emailFilter = (userEmail != null && !userEmail.isBlank()) ? userEmail : null;
        String entityFilter = (entityType != null && !entityType.isBlank()) ? entityType : null;

        return auditRepo.findFiltered(emailFilter, actionEnum, entityFilter,
                fromDt, toDt, pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getEntityHistory(String entityType, String entityId) {
        return auditRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    @Transactional(readOnly = true)
    public AuditStats getStats() {
        LocalDateTime last24h  = LocalDateTime.now().minusHours(24);
        LocalDateTime last7d   = LocalDateTime.now().minusDays(7);
        LocalDateTime last30d  = LocalDateTime.now().minusDays(30);

        return AuditStats.builder()
                .totalEvents(auditRepo.count())
                .eventsLast24h(auditRepo.countByCreatedAtAfter(last24h))
                .eventsLast7d(auditRepo.countByCreatedAtAfter(last7d))
                .eventsLast30d(auditRepo.countByCreatedAtAfter(last30d))
                .activeUsersLast7d(auditRepo.countActiveUsersSince(last7d))
                .build();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private void logInternal(Action action,
                              String entityType,
                              String entityId,
                              String entityName,
                              String description,
                              String oldValue,
                              String newValue,
                              Outcome outcome,
                              String errorMessage) {
        try {
            // Resolve current user from Spring Security context
            String userEmail = resolveEmail();
            String userName  = resolveUserName(userEmail);
            String ipAddress = resolveIpAddress();

            AuditLog entry = AuditLog.builder()
                    .userEmail(userEmail)
                    .userName(userName)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .description(description)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .outcome(outcome)
                    .errorMessage(errorMessage)
                    .ipAddress(ipAddress)
                    .build();

            auditRepo.save(entry);
            log.debug("Audit: [{}] {} → {} ({})", userEmail, action, entityName, outcome);

        } catch (Exception e) {
            // Audit logging must NEVER break the main flow
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    private String resolveEmail() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName(); // returns email (set by JwtAuthFilter)
            }
        } catch (Exception ignored) {}
        return "system";
    }

    private String resolveUserName(String email) {
        if (email == null || email.equals("system")) return "System";
        try {
            return userRepo.findByEmail(email)
                    .map(User::getName)
                    .orElse(email);
        } catch (Exception e) {
            return email;
        }
    }

    private String resolveIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String forwarded = req.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                    return forwarded.split(",")[0].trim();
                }
                return req.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private LocalDateTime parseDate(String raw, LocalDateTime fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return LocalDateTime.parse(raw, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(raw + "T00:00:00",
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ignored) {
                return fallback;
            }
        }
    }

    // ── Stats DTO ─────────────────────────────────────────────────────────────

    @lombok.Data @lombok.Builder
    public static class AuditStats {
        private long totalEvents;
        private long eventsLast24h;
        private long eventsLast7d;
        private long eventsLast30d;
        private long activeUsersLast7d;
    }
}
