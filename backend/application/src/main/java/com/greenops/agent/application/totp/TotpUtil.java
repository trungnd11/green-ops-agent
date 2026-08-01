package com.greenops.agent.application.totp;

import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.time.Instant;

@Component
public class TotpUtil {

    private static final int CODE_DIGITS = 6;
    private static final int TIME_STEP = 30;
    private static final String HMAC_ALGO = "HmacSHA1";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String BASE32_ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public String generateSecret() {
        byte[] bytes = new byte[10];
        RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        int buf = 0, bits = 0;
        for (byte b : bytes) {
            buf = (buf << 8) | (b & 0xFF);
            bits += 8;
            while (bits >= 5) {
                sb.append(BASE32_ALPH.charAt((buf >> (bits - 5)) & 0x1F));
                bits -= 5;
            }
        }
        if (bits > 0) {
            sb.append(BASE32_ALPH.charAt((buf << (5 - bits)) & 0x1F));
        }
        return sb.toString();
    }

    private byte[] base32Decode(String s) {
        String clean = s.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int len = clean.length() * 5 / 8;
        byte[] out = new byte[len];
        int buf = 0, bits = 0, idx = 0;
        for (char c : clean.toCharArray()) {
            int val = c >= 'A' ? c - 'A' : c - '2' + 26;
            buf = (buf << 5) | val;
            bits += 5;
            if (bits >= 8) {
                out[idx++] = (byte) ((buf >> (bits - 8)) & 0xFF);
                bits -= 8;
            }
        }
        return out;
    }

    public String getQrCodeUrl(String secret, String username, String issuer) {
        return "otpauth://totp/"
                + issuer + ":" + username
                + "?secret=" + secret
                + "&issuer=" + issuer
                + "&digits=" + CODE_DIGITS
                + "&period=" + TIME_STEP;
    }

    public boolean verify(String secret, String code) {
        try {
            int otp = Integer.parseInt(code);
            long tw = Instant.now().getEpochSecond() / TIME_STEP;
            for (long i = -1; i <= 1; i++) {
                if (genOtp(secret, tw + i) == otp) return true;
            }
            return false;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private int genOtp(String secret, long tw) {
        try {
            byte[] key = base32Decode(secret);
            byte[] data = new byte[8];
            for (int i = 7; i >= 0; i--) { data[i] = (byte)(tw & 0xFF); tw >>= 8; }
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(key, HMAC_ALGO));
            byte[] hash = mac.doFinal(data);
            int off = hash[hash.length - 1] & 0xF;
            int bin = ((hash[off] & 0x7F) << 24) | ((hash[off+1] & 0xFF) << 16) | ((hash[off+2] & 0xFF) << 8) | (hash[off+3] & 0xFF);
            return bin % (int)Math.pow(10, CODE_DIGITS);
        } catch (Exception e) {
            throw new RuntimeException("OTP gen failed", e);
        }
    }
}
