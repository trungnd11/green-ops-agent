package com.greenops.agent.application.dto.twofa;

import jakarta.validation.constraints.NotBlank;

public record Enable2FARequest(@NotBlank String otp) {}
