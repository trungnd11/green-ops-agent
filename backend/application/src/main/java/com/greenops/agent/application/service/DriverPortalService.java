package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.DriverDashboardResponse;
import com.greenops.agent.application.dto.DriverProfileResponse;
import com.greenops.agent.application.dto.TopupRequest;
import com.greenops.agent.application.dto.WithdrawRequest;
import com.greenops.agent.domain.*;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.application.exception.ResourceNotFoundException;
import com.greenops.agent.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverPortalService {

    private final DriverRepository driverRepository;
    private final RevenueDetailRepository revenueDetailRepository;
    private final RevenuePeriodRepository periodRepository;
    private final TransactionRepository transactionRepository;
    private final AdminTaskRepository adminTaskRepository;

    // We'll use a thread-local or pass driverId directly since this is per-request
    // Actually, let's just make methods take driverId as parameter

    public DriverDashboardResponse getDashboard(UUID driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", driverId));

        // Lấy kỳ gần nhất
        var periods = periodRepository.findByCompanyIdOrderByStartDateDesc(
                driver.getCompany().getId(), PageRequest.of(0, 1));
        RevenuePeriod latestPeriod = periods.getContent().isEmpty() ? null : periods.getContent().get(0);

        DriverDashboardResponse.DriverDashboardResponseBuilder builder = DriverDashboardResponse.builder()
                .driverCode(driver.getDriverCode())
                .fullName(driver.getFullName())
                .phone(driver.getPhone());

        if (latestPeriod != null) {
            var detail = revenueDetailRepository.findByPeriodIdAndDriverId(
                    latestPeriod.getId(), driverId).orElse(null);
            if (detail != null) {
                builder.xanhBalance(detail.getXanhBalance())
                        .depositIn(detail.getDepositIn())
                        .withdrawn(detail.getWithdrawn())
                        .availableBalance(detail.getAvailableBalance())
                        .totalBalance(detail.getTotalBalance())
                        .latestPeriod(latestPeriod.getName())
                        .latestRevenue(detail.getTotalRevenue())
                        .latestTrips(detail.getTotalTrips());
            }
        }

        // Lấy 10 giao dịch gần nhất
        var txs = transactionRepository.findByDriverIdOrderByCreatedAtDesc(
                driverId, PageRequest.of(0, 10));
        builder.recentTransactions(txs.getContent().stream().map(tx ->
            DriverDashboardResponse.TransactionItem.builder()
                    .transactionCode(tx.getTransactionCode())
                    .transactionType(tx.getTransactionType())
                    .amount(tx.getAmount())
                    .balanceAfter(tx.getBalanceAfter())
                    .status(tx.getStatus())
                    .note(tx.getNote())
                    .createdAt(tx.getCreatedAt().toString())
                    .build()
        ).toList());

        return builder.build();
    }

    public List<DriverDashboardResponse.TransactionItem> getTransactions(
            UUID driverId, int page, int size, String type) {
        var txs = (type != null && !type.isBlank())
                ? transactionRepository.findByDriverIdAndTransactionTypeOrderByCreatedAtDesc(
                        driverId, type, PageRequest.of(page, size))
                : transactionRepository.findByDriverIdOrderByCreatedAtDesc(
                        driverId, PageRequest.of(page, size));
        return txs.getContent().stream().map(tx ->
            DriverDashboardResponse.TransactionItem.builder()
                    .transactionCode(tx.getTransactionCode())
                    .transactionType(tx.getTransactionType())
                    .amount(tx.getAmount())
                    .balanceAfter(tx.getBalanceAfter())
                    .status(tx.getStatus())
                    .note(tx.getNote())
                    .createdAt(tx.getCreatedAt().toString())
                    .build()
        ).toList();
    }

    @Transactional
    public void requestWithdraw(UUID driverId, WithdrawRequest request) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", driverId));

        // Kiểm tra số dư (từ kỳ gần nhất)
        var periods = periodRepository.findByCompanyIdOrderByStartDateDesc(
                driver.getCompany().getId(), PageRequest.of(0, 1));
        if (periods.getContent().isEmpty()) {
            throw new BusinessException("Chưa có dữ liệu doanh thu");
        }

        RevenuePeriod latestPeriod = periods.getContent().get(0);
        var detail = revenueDetailRepository.findByPeriodIdAndDriverId(
                latestPeriod.getId(), driverId).orElse(null);

        BigDecimal availableBalance = (detail != null) ? detail.getAvailableBalance() : BigDecimal.ZERO;

        if (request.getAmount().compareTo(availableBalance) > 0) {
            throw new BusinessException("Số dư khả dụng không đủ (hiện có: "
                    + availableBalance.toPlainString() + " ₫)");
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Số tiền rút phải lớn hơn 0");
        }

        // Tạo transaction yêu cầu rút
        Transaction tx = Transaction.builder()
                .driver(driver)
                .transactionCode("WD-" + System.currentTimeMillis())
                .transactionType("withdraw")
                .status("PENDING")
                .amount(request.getAmount().negate()) // số âm
                .balanceBefore(availableBalance)
                .balanceAfter(availableBalance.subtract(request.getAmount()))
                .note("Yêu cầu rút: " + request.getBankInfo()
                        + (request.getNote() != null ? " - " + request.getNote() : ""))
                .build();

        transactionRepository.save(tx);

        AdminTask task = AdminTask.builder()
                .title("Duyệt rút tiền " + tx.getTransactionCode())
                .description("Tài xế " + driver.getDriverCode() + " yêu cầu rút " + request.getAmount().toPlainString() + "₫")
                .priority("medium")
                .status("pending")
                .referenceType("transaction")
                .referenceId(tx.getId())
                .build();
        adminTaskRepository.save(task);

        log.info("Driver {} requested withdraw: {} - bank: {}",
                driver.getDriverCode(), request.getAmount(), request.getBankInfo());
    }

    /**
     * Lay thong tin chi tiet cua tai xe
     */
    public DriverProfileResponse getProfile(UUID driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("TÃ i xáº¿", driverId));

        // Láº¥y ká»³ gáº§n nháº¥t Ä‘á»ƒ tÃ­nh sá»‘ dÆ°
        var periods = periodRepository.findByCompanyIdOrderByStartDateDesc(
                driver.getCompany().getId(), PageRequest.of(0, 1));
        RevenuePeriod latestPeriod = periods.getContent().isEmpty() ? null : periods.getContent().get(0);

        BigDecimal availableBalance = BigDecimal.ZERO;
        BigDecimal totalBalance = BigDecimal.ZERO;
        if (latestPeriod != null) {
            var detail = revenueDetailRepository.findByPeriodIdAndDriverId(
                    latestPeriod.getId(), driverId).orElse(null);
            if (detail != null) {
                availableBalance = detail.getAvailableBalance();
                totalBalance = detail.getTotalBalance();
            }
        }

        return DriverProfileResponse.builder()
                .driverCode(driver.getDriverCode())
                .fullName(driver.getFullName())
                .phone(driver.getPhone())
                .email(driver.getEmail())
                .cccd(driver.getCccd())
                .cccdIssueDate(driver.getCccdIssueDate())
                .cccdIssuePlace(driver.getCccdIssuePlace())
                .birthDate(driver.getBirthDate())
                .gender(driver.getGender())
                .address(driver.getAddress())
                .licenseNumber(driver.getLicenseNumber())
                .licenseClass(driver.getLicenseClass())
                .joinDate(driver.getJoinDate())
                .status(driver.getStatus())
                .depositAmount(driver.getDepositAmount())
                .availableBalance(availableBalance)
                .totalBalance(totalBalance)
                .build();
    }

    @Transactional
    public void requestTopup(UUID driverId, TopupRequest request) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("TÃ i xáº¿", driverId));

        // Kiá»ƒm tra sá»‘ dÆ° hiá»‡n táº¡i
        var periods = periodRepository.findByCompanyIdOrderByStartDateDesc(
                driver.getCompany().getId(), PageRequest.of(0, 1));
        BigDecimal currentBalance = BigDecimal.ZERO;
        if (!periods.getContent().isEmpty()) {
            RevenuePeriod latestPeriod = periods.getContent().get(0);
            var detail = revenueDetailRepository.findByPeriodIdAndDriverId(
                    latestPeriod.getId(), driverId).orElse(null);
            if (detail != null) {
                currentBalance = detail.getAvailableBalance();
            }
        }

        // Táº¡o giao dá»‹ch náº¡p tiá»n
        Transaction tx = Transaction.builder()
                .driver(driver)
                .transactionCode("TOP-" + System.currentTimeMillis())
                .transactionType("topup")
                .status("PENDING")
                .amount(request.getAmount()) // sá»‘ dÆ°Æ¡ng
                .balanceBefore(currentBalance)
                .balanceAfter(currentBalance.add(request.getAmount()))
                .note("Nap tien: " + (request.getPaymentMethod() != null ? request.getPaymentMethod() : "Chuyen khoan")
                        + (request.getNote() != null ? " - " + request.getNote() : ""))
                .build();

        transactionRepository.save(tx);

        AdminTask task = AdminTask.builder()
                .title("Duyệt nạp tiền " + tx.getTransactionCode())
                .description("Tài xế " + driver.getDriverCode() + " yêu cầu nạp " + request.getAmount().toPlainString() + "₫")
                .priority("medium")
                .status("pending")
                .referenceType("transaction")
                .referenceId(tx.getId())
                .build();
        adminTaskRepository.save(task);

        log.info("Driver {} requested topup: {} - method: {}",
                driver.getDriverCode(), request.getAmount(), request.getPaymentMethod());
    }

    /**
     * Lấy danh sách doanh thu theo kỳ cho tài xế
     */
    public List<?> getRevenueHistory(UUID driverId, String keyword) {
        var periods = periodRepository.findByCompanyIdOrderByStartDateDesc(
                driverRepository.findById(driverId).orElseThrow().getCompany().getId(),
                PageRequest.of(0, 100));
        return periods.getContent().stream()
                .filter(p -> keyword == null || keyword.isBlank()
                        || p.getName().toLowerCase().contains(keyword.toLowerCase()))
                .map(p -> {
            var d = revenueDetailRepository.findByPeriodIdAndDriverId(p.getId(), driverId).orElse(null);
            if (d == null) return null;
            return java.util.Map.of(
                    "periodName", p.getName(),
                    "startDate", p.getStartDate().toString(),
                    "endDate", p.getEndDate().toString(),
                    "totalRevenue", d.getTotalRevenue(),
                    "totalTrips", d.getTotalTrips(),
                    "earnedAmount", d.getEarnedAmount(),
                    "totalBalance", d.getTotalBalance(),
                    "availableBalance", d.getAvailableBalance()
            );
        }).filter(java.util.Objects::nonNull).toList();
    }
}
