package com.greenops.agent.application.dto.twofa;

public record TwoFAStatusResponse(boolean enabled, String qrCodeUrl) {}
