package com.greenops.agent.application.dto.twofa;

import jakarta.validation.constraints.NotBlank;

public record Verify2FARequest(@NotBlank String username, @NotBlank String otp) {}
