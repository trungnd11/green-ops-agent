package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.PageResponse;
import com.greenops.agent.domain.Driver;
import com.greenops.agent.domain.Notification;
import com.greenops.agent.domain.NotificationRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EntityManager entityManager;

    @Transactional
    public Notification create(UUID driverId, String type, String title, String message,
                               String referenceType, UUID referenceId) {
        Notification notif = Notification.builder()
                .driver(driverId != null ? entityManager.getReference(Driver.class, driverId) : null)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .isRead(false)
                .build();
        notif = notificationRepository.save(notif);

        if (driverId != null) {
            messagingTemplate.convertAndSendToUser(
                    driverId.toString(), "/queue/notifications", notif);
        }
        return notif;
    }

    @Transactional(readOnly = true)
    public PageResponse<Notification> getDriverNotifications(UUID driverId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByDriverIdOrderByCreatedAtDesc(driverId, pageable);
        return PageResponse.<Notification>builder()
                .items(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID driverId) {
        return notificationRepository.countByDriverIdAndIsReadFalse(driverId);
    }

    @Transactional
    public void markAllAsRead(UUID driverId) {
        notificationRepository.markAllAsReadByDriver(driverId);
    }

    @Transactional
    public void markAsRead(UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }
}
