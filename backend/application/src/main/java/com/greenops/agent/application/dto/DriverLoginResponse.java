package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverLoginResponse {
    private UUID driverId;
    private String driverCode;
    private String fullName;
    private String phone;
    private String token;
    private UUID companyId;
}
