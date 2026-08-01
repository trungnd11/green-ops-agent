package com.greenops.agent.application.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWithdrawRequest {
    @Positive
    private BigDecimal amount;
    private String bankName;
    private String bankAccount;
    private String bankHolder;
    private String note;
}
