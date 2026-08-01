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
public class LoginResponse {
    private UUID userId;
    private String username;
    private String fullName;
    private String role;
    private String token;
    private String refreshToken;
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private boolean require2fa;
    private boolean forcePasswordChange;
}
