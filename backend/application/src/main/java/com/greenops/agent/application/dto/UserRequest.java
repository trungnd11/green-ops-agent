package com.greenops.agent.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private String email;
    private String phone;
    private String role;
    private String status;
}
