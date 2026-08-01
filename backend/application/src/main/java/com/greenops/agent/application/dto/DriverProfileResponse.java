package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileResponse {
    private String driverCode;
    private String fullName;
    private String phone;
    private String email;
    private String cccd;
    private LocalDate cccdIssueDate;
    private String cccdIssuePlace;
    private LocalDate birthDate;
    private String gender;
    private String address;
    private String licenseNumber;
    private String licenseClass;
    private LocalDate joinDate;
    private String status;
    private BigDecimal depositAmount;
    private BigDecimal availableBalance;
    private BigDecimal totalBalance;
}
