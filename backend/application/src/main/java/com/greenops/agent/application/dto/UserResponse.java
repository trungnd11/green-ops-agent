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
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String companyName;
    private String status;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private String deactivatedReason;
    private String deactivatedNote;
    private LocalDateTime deactivatedAt;
}
