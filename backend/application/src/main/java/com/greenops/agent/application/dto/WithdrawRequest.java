package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequest {
    @NotNull(message = "Số tiền không được để trống")
    private BigDecimal amount;

    @NotBlank(message = "Thông tin nhận tiền không được để trống")
    private String bankInfo;

    private String note;
}
