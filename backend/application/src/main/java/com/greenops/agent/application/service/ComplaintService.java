package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final DriverRepository driverRepository;
    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AdminTaskRepository adminTaskRepository;

    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> getComplaints(String status, Pageable pageable) {
        Page<Complaint> page;
        if (status != null && !"all".equals(status)) {
            page = complaintRepository.findByStatus(status, pageable);
        } else {
            page = complaintRepository.findAll(pageable);
        }
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> getDriverComplaints(UUID driverId, Pageable pageable) {
        Page<Complaint> page = complaintRepository.findByDriverId(driverId, pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public ComplaintResponse getComplaint(UUID id) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khiếu nại", id));
        return toResponse(c);
    }

    public ComplaintStatsResponse getStats() {
        return ComplaintStatsResponse.builder()
                .pending(complaintRepository.countByStatus("pending"))
                .processing(complaintRepository.countByStatus("processing"))
                .resolved(complaintRepository.countByStatus("resolved"))
                .rejected(complaintRepository.countByStatus("rejected"))
                .build();
    }

    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request, UUID userId, boolean isDriver) {
        Driver driver = request.getDriverId() != null
                ? driverRepository.findById(request.getDriverId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tài xế", request.getDriverId()))
                : null;

        Settlement settlement = request.getSettlementId() != null
                ? settlementRepository.findById(request.getSettlementId())
                        .orElseThrow(() -> new ResourceNotFoundException("Quyết toán", request.getSettlementId()))
                : null;

        User createdBy = null;
        if (!isDriver) {
            createdBy = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));
        }

        String code = "KN-" + java.time.LocalDate.now().toString().replace("-", "") +
                "-" + String.format("%04d", (int) (Math.random() * 10000));

        Complaint complaint = Complaint.builder()
                .driver(driver)
                .settlement(settlement)
                .code(code)
                .category(request.getCategory() != null ? request.getCategory() : "khac")
                .title(request.getTitle())
                .description(request.getDescription())
                .amount(request.getAmount() != null ? request.getAmount() : java.math.BigDecimal.ZERO)
                .evidence(request.getEvidence() != null ? request.getEvidence() : "[]")
                .status("pending")
                .createdBy(createdBy)
                .build();

        complaint = complaintRepository.save(complaint);
        log.info("Created complaint: {} - {}", complaint.getCode(), complaint.getTitle());

        // Auto-create task for new complaint
        AdminTask task = AdminTask.builder()
                .title("Xử lý khiếu nại " + complaint.getCode())
                .description(complaint.getTitle())
                .priority("high")
                .status("pending")
                .referenceType("complaint")
                .referenceId(complaint.getId())
                .createdBy(createdBy)
                .build();
        adminTaskRepository.save(task);

        return toResponse(complaint);
    }

    @Transactional
    public ComplaintResponse respondComplaint(UUID id, ComplaintRespondRequest request, UUID userId) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khiếu nại", id));

        User responder = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        String newStatus = switch (request.getAction()) {
            case "resolve" -> "resolved";
            case "reject" -> "rejected";
            default -> throw new BusinessException("Hành động không hợp lệ: " + request.getAction());
        };

        complaint.setStatus(newStatus);
        complaint.setResponse(request.getResponse());
        complaint.setRespondedBy(responder);
        complaint.setRespondedAt(LocalDateTime.now());

        complaint = complaintRepository.save(complaint);
        log.info("Responded to complaint {}: {}", complaint.getCode(), newStatus);

        UUID driverId = complaint.getDriver() != null ? complaint.getDriver().getId() : null;
        if (driverId != null) {
            notificationService.create(driverId, "complaint_" + newStatus,
                    "Khiếu nại đã được phản hồi",
                    "Khiếu nại " + complaint.getCode() + " đã được " + ("resolved".equals(newStatus) ? "giải quyết" : "từ chối"),
                    "complaint", complaint.getId());
        }

        return toResponse(complaint);
    }

    private PageResponse<ComplaintResponse> toPageResponse(Page<Complaint> page) {
        return PageResponse.<ComplaintResponse>builder()
                .items(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .driverId(c.getDriver() != null ? c.getDriver().getId() : null)
                .driverName(c.getDriver() != null ? c.getDriver().getFullName() : null)
                .driverCode(c.getDriver() != null ? c.getDriver().getDriverCode() : null)
                .settlementId(c.getSettlement() != null ? c.getSettlement().getId() : null)
                .settlementCode(c.getSettlement() != null ? c.getSettlement().getSettlementCode() : null)
                .code(c.getCode())
                .category(c.getCategory())
                .title(c.getTitle())
                .description(c.getDescription())
                .amount(c.getAmount())
                .evidence(c.getEvidence())
                .status(c.getStatus())
                .response(c.getResponse())
                .respondedByName(c.getRespondedBy() != null ? c.getRespondedBy().getFullName() : null)
                .respondedAt(c.getRespondedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
