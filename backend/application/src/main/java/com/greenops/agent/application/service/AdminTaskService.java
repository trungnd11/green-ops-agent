package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminTaskService {

    private final AdminTaskRepository adminTaskRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminTaskResponse> getTasks(String status, Pageable pageable) {
        Page<AdminTask> page;
        if (status != null && !"all".equals(status)) {
            page = adminTaskRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = adminTaskRepository.findAll(pageable);
        }
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public AdminTaskResponse getTask(UUID id) {
        AdminTask task = adminTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Công việc", id));
        return toResponse(task);
    }

    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return adminTaskRepository.countByStatus(status);
    }

    @Transactional
    public AdminTaskResponse createTask(AdminTaskRequest request, UUID userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        User assignee = request.getAssigneeId() != null
                ? userRepository.findById(request.getAssigneeId()).orElse(null)
                : null;

        AdminTask task = AdminTask.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : "medium")
                .status("pending")
                .assignee(assignee)
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .dueDate(request.getDueDate())
                .createdBy(creator)
                .build();

        task = adminTaskRepository.save(task);
        log.info("Created task: {}", task.getTitle());
        return toResponse(task);
    }

    @Transactional
    public AdminTaskResponse updateStatus(UUID id, String status, UUID userId) {
        AdminTask task = adminTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Công việc", id));

        task.setStatus(status);
        task = adminTaskRepository.save(task);
        log.info("Updated task {} status to: {}", task.getTitle(), status);
        return toResponse(task);
    }

    private PageResponse<AdminTaskResponse> toPageResponse(Page<AdminTask> page) {
        return PageResponse.<AdminTaskResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private AdminTaskResponse toResponse(AdminTask task) {
        return AdminTaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .status(task.getStatus())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeName(task.getAssignee() != null ? task.getAssignee().getFullName() : null)
                .referenceType(task.getReferenceType())
                .referenceId(task.getReferenceId())
                .dueDate(task.getDueDate())
                .createdByName(task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : "Hệ thống")
                .createdAt(task.getCreatedAt())
                .build();
    }
}
