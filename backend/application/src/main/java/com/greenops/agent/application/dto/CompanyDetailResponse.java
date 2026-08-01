package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDetailResponse {
    private UUID id;
    private String code;
    private String name;
    private String address;
    private String phone;
    private String email;
    private String taxCode;
    private String contactPerson;
    private String logoUrl;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
