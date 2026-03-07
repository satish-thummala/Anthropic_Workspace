package com.techcorp.compliance.controller;

import com.techcorp.compliance.entity.Notification;
import com.techcorp.compliance.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notifService;

    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    // ── GET /api/v1/notifications ─────────────────────────────────────────────
    /** Returns all notifications for the logged-in user */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll(
            @AuthenticationPrincipal UserDetails principal) {
        log.info("GET /notifications user={}", principal.getUsername());
        List<Map<String, Object>> result = notifService
            .getForUser(principal.getUsername())
            .stream()
            .map(this::toMap)
            .toList();
        return ResponseEntity.ok(result);
    }

    // ── GET /api/v1/notifications/count ───────────────────────────────────────
    /** Returns unread count — used to drive the badge number */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails principal) {
        long count = notifService.getUnreadCount(principal.getUsername());
        return ResponseEntity.ok(Map.of("unread", count));
    }

    // ── PATCH /api/v1/notifications/{id}/read ─────────────────────────────────
    /** Mark a single notification as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {
        log.info("PATCH /notifications/{}/read user={}", id, principal.getUsername());
        notifService.markRead(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── PATCH /api/v1/notifications/read-all ─────────────────────────────────
    /** Mark ALL notifications as read */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal UserDetails principal) {
        log.info("PATCH /notifications/read-all user={}", principal.getUsername());
        notifService.markAllRead(principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── helper ────────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(Notification n) {
        return Map.of(
            "id",        n.getId(),
            "type",      n.getType().name(),
            "title",     n.getTitle(),
            "message",   n.getMessage(),
            "linkPage",  n.getLinkPage() != null ? n.getLinkPage() : "",
            "read",      n.isRead(),
            "createdAt", n.getCreatedAt().format(FMT)
        );
    }
}
