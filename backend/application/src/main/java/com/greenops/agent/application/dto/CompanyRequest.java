package com.greenops.agent.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyRequest {
    private String code;
    private String name;
    private String address;
    private String phone;
    private String email;
    private String taxCode;
    private String contactPerson;
    private String status;
}
