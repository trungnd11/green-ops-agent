package com.greenops.agent.interfaces.controller;

import com.greenops.agent.application.dto.*;
import com.greenops.agent.application.service.UserWalletService;
import com.greenops.agent.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/user-wallet")
@RequiredArgsConstructor
public class UserWalletController {

    private final UserWalletService userWalletService;

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<UserBalanceResponse>> getBalance(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(userWalletService.getBalance(user.getId())));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PageResponse<UserTransactionResponse>>> getTransactions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(
                userWalletService.getTransactions(user.getId(), pageable)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<UserTransactionResponse>> requestWithdraw(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UserWithdrawRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Yêu cầu rút tiền đã được gửi",
                userWalletService.requestWithdraw(user.getId(), request, user.getId())));
    }

    @GetMapping("/withdrawals/pending")
    public ResponseEntity<ApiResponse<PageResponse<UserTransactionResponse>>> getPendingWithdrawals(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return ResponseEntity.ok(ApiResponse.ok(
                userWalletService.getPendingWithdrawals(pageable)));
    }

    @PostMapping("/withdrawals/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveWithdrawal(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        userWalletService.approveWithdrawal(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Duyệt rút tiền thành công", null));
    }

    @PostMapping("/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectWithdrawal(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        userWalletService.rejectWithdrawal(
                id, user.getId(), body.getOrDefault("reason", ""));
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối rút tiền", null));
    }
}
