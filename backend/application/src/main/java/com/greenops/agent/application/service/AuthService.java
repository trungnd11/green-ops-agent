package com.greenops.agent.application.service;

import com.greenops.agent.application.dto.LoginRequest;
import com.greenops.agent.application.dto.LoginResponse;
import com.greenops.agent.application.service.twofa.TwoFAService;
import com.greenops.agent.domain.User;
import com.greenops.agent.application.exception.BusinessException;
import com.greenops.agent.domain.UserRepository;
import com.greenops.agent.domain.TokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final TwoFAService twoFAService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("Tên đăng nhập hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        if (!"active".equals(user.getStatus())) {
            throw new BusinessException("Tài khoản đã bị khóa");
        }

        boolean require2fa = twoFAService.isEnabled(user.getId());

        if (!require2fa) {
            String role = "USER";
            String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), role);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getUsername());
            user.setLastLogin(LocalDateTime.now());
            user.setRefreshToken(refreshToken);
            userRepository.save(user);
            return LoginResponse.builder()
                    .userId(user.getId()).username(user.getUsername()).fullName(user.getFullName())
                    .role(role).token(token).refreshToken(refreshToken)
                    .companyId(user.getCompany().getId()).companyName(user.getCompany().getName())
                    .companyCode(user.getCompany().getCode())
                    .require2fa(false).forcePasswordChange(user.isForcePasswordChange()).build();
        }

        return LoginResponse.builder()
                .userId(user.getId()).username(user.getUsername()).fullName(user.getFullName())
                .companyId(user.getCompany().getId()).companyName(user.getCompany().getName())
                .companyCode(user.getCompany().getCode())
                .require2fa(true).forcePasswordChange(user.isForcePasswordChange()).build();
    }

    public LoginResponse verify2fa(String username, String otp) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));

        if (!"active".equals(user.getStatus())) {
            throw new BusinessException("Tài khoản đã bị khóa");
        }

        if (!twoFAService.verify(user.getId(), otp)) {
            throw new BusinessException("Mã OTP không hợp lệ");
        }

        String role = "USER";
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), role);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getUsername());
        user.setLastLogin(LocalDateTime.now());
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return LoginResponse.builder()
                .userId(user.getId()).username(user.getUsername()).fullName(user.getFullName())
                .role(role).token(token).refreshToken(refreshToken)
                .companyId(user.getCompany().getId()).companyName(user.getCompany().getName())
                .companyCode(user.getCompany().getCode())
                .require2fa(false).forcePasswordChange(user.isForcePasswordChange()).build();
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));

        if (!"active".equals(user.getStatus())) {
            throw new BusinessException("Tài khoản đã bị khóa");
        }

        if (!refreshToken.equals(user.getRefreshToken())) {
            throw new BusinessException("Refresh token không hợp lệ");
        }

        String role = "USER";
        String newToken = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), role);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getUsername());

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(role)
                .token(newToken)
                .refreshToken(newRefreshToken)
                .companyId(user.getCompany().getId())
                .companyName(user.getCompany().getName())
                .companyCode(user.getCompany().getCode())
                .build();
    }
}
