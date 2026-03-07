package com.techcorp.compliance.service;

import com.techcorp.compliance.entity.Notification;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.NotificationRepository;
import com.techcorp.compliance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final UserRepository         userRepo;

    /** All notifications for the current user, newest first */
    @Transactional(readOnly = true)
    public List<Notification> getForUser(String email) {
        User user = getUser(email);
        return notifRepo.findByUserOrderByCreatedAtDesc(user);
    }

    /** Unread count badge number */
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = getUser(email);
        return notifRepo.countByUserAndReadFalse(user);
    }

    /** Mark a single notification as read */
    @Transactional
    public void markRead(String notifId, String email) {
        notifRepo.findById(notifId).ifPresent(n -> {
            if (n.getUser().getEmail().equals(email)) {
                n.setRead(true);
                notifRepo.save(n);
            }
        });
    }

    /** Mark every unread notification as read */
    @Transactional
    public void markAllRead(String email) {
        User user = getUser(email);
        notifRepo.markAllReadForUser(user);
        log.info("Marked all notifications read for {}", email);
    }

    // ── helper ────────────────────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
