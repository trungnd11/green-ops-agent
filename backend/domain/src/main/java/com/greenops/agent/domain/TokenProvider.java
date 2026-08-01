package com.greenops.agent.domain;

import java.util.UUID;

public interface TokenProvider {
    String generateToken(UUID userId, String username, String role);
    String generateRefreshToken(UUID userId, String username);
    String getUsernameFromToken(String token);
    UUID getUserIdFromToken(String token);
    String getRoleFromToken(String token);
    boolean validateToken(String token);
}
