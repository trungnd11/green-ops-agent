package com.greenops.agent.application.dto;

import com.greenops.agent.domain.User;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class CurrentUserResponse {
    UUID id;
    String username;
    String fullName;
    String email;
    String phone;
    String status;
    LocalDateTime lastLogin;

    public static CurrentUserResponse from(User user) {
        return CurrentUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
