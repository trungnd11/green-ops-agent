package com.greenops.agent.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopupRequest {
    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 10000, message = "Số tiền tối thiểu là 10,000 ₫")
    private BigDecimal amount;

    private String paymentMethod;
    private String note;
}
