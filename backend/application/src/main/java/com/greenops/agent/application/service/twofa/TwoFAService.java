package com.greenops.agent.application.service.twofa;

import com.greenops.agent.application.dto.twofa.TwoFAStatusResponse;
import com.greenops.agent.domain.User2FA;
import com.greenops.agent.domain.User2FARepository;
import com.greenops.agent.application.totp.TotpUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TwoFAService {

    private final User2FARepository user2FARepository;
    private final TotpUtil totpUtil;

    @Transactional
    public TwoFAStatusResponse getStatus(UUID userId) {
        var opt = user2FARepository.findByUserId(userId);
        if (opt.isEmpty() || !opt.get().isEnabled()) {
            String secret = totpUtil.generateSecret();
            User2FA record = opt.orElseGet(() -> User2FA.builder().userId(userId).secret(secret).build());
            if (opt.isEmpty()) {
                user2FARepository.save(record);
            }
            return new TwoFAStatusResponse(false, null);
        }
        User2FA record = opt.get();
        String qrUrl = totpUtil.getQrCodeUrl(record.getSecret(), userId.toString(), "GREENOPS");
        return new TwoFAStatusResponse(true, qrUrl);
    }

    @Transactional
    public TwoFAStatusResponse getSetupInfo(UUID userId) {
        String secret = totpUtil.generateSecret();
        User2FA record = user2FARepository.findByUserId(userId)
                .orElse(User2FA.builder().userId(userId).secret(secret).build());
        if (!record.getSecret().equals(secret)) {
            record.setSecret(secret);
        }
        user2FARepository.save(record);
        String qrUrl = totpUtil.getQrCodeUrl(record.getSecret(), userId.toString(), "GREENOPS");
        return new TwoFAStatusResponse(false, qrUrl);
    }

    @Transactional
    public boolean enable(UUID userId, String otp) {
        User2FA record = user2FARepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Chưa tạo secret 2FA"));
        if (!totpUtil.verify(record.getSecret(), otp)) {
            return false;
        }
        record.setEnabled(true);
        user2FARepository.save(record);
        return true;
    }

    @Transactional
    public void disable(UUID userId) {
        user2FARepository.findByUserId(userId).ifPresent(record -> {
            record.setEnabled(false);
            user2FARepository.save(record);
        });
    }

    public boolean isEnabled(UUID userId) {
        return user2FARepository.existsByUserIdAndEnabledTrue(userId);
    }

    public boolean verify(UUID userId, String otp) {
        return user2FARepository.findByUserId(userId)
                .filter(User2FA::isEnabled)
                .filter(record -> totpUtil.verify(record.getSecret(), otp))
                .isPresent();
    }
}
