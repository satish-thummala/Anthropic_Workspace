package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Notification;
import com.techcorp.compliance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    /** All notifications for a user, newest first */
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    /** Count of unread notifications */
    long countByUserAndReadFalse(User user);

    /** Mark all unread as read for a user */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user = :user AND n.read = false")
    void markAllReadForUser(User user);
}
