package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverLoginRequest {
    private UUID companyId;

    @NotBlank(message = "Mã LX hoặc SĐT không được để trống")
    private String identifier;
}
