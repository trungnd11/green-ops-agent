package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverRequest {
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
    private LocalDate resignDate;
    private String status;
    private java.math.BigDecimal depositAmount;
    private String note;
    private UUID referrerId;
}
