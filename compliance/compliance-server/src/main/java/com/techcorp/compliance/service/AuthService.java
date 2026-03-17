package com.techcorp.compliance.service;

import com.techcorp.compliance.dto.AuthDTOs.*;
import com.techcorp.compliance.entity.AuditLog.Action;
import com.techcorp.compliance.entity.RefreshToken;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.RefreshTokenRepository;
import com.techcorp.compliance.repository.UserRepository;
import com.techcorp.compliance.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil                jwtUtil;
    private final AuditService           auditService;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    // ─── LOGIN ─────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            // Authenticate with Spring Security
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
        } catch (AuthenticationException e) {
            log.warn("Login failed for email: {}", request.getEmail());
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadCredentialsException("User not found"));

        // Revoke existing refresh tokens
        refreshTokenRepository.revokeAllUserTokens(user);

        // Generate new tokens
        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = createRefreshToken(user);

        log.info("Successful login for user: {}", user.getEmail());
        auditService.logForUser(
                user.getEmail(), Action.USER_LOGIN,
                "Auth", null, user.getName(), "Successful login");
        return buildLoginResponse(user, accessToken, refreshToken);
    }

    // ─── REFRESH TOKEN ─────────────────────────────────────────────────────────
    @Transactional
    public TokenRefreshResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (storedToken.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }

        if (storedToken.isExpired()) {
            storedToken.setRevoked(true);
            refreshTokenRepository.save(storedToken);
            throw new RuntimeException("Refresh token has expired. Please login again.");
        }

        User user = storedToken.getUser();

        // Rotate refresh token (revoke old, issue new)
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String newAccessToken = jwtUtil.generateAccessToken(user);
        String newRefreshToken = createRefreshToken(user);

        TokenRefreshResponse response = new TokenRefreshResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setExpiresIn(jwtUtil.getAccessTokenExpiry());
        return response;
    }

    // ─── LOGOUT ────────────────────────────────────────────────────────────────
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            refreshTokenRepository.revokeAllUserTokens(user);
            log.info("User logged out: {}", email);
            auditService.logForUser(
                    email, Action.USER_LOGOUT,
                    "Auth", null, user.getName(), "User logged out");
        });
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────
    private String createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
            .token(UUID.randomUUID().toString())
            .user(user)
            .expiresAt(Instant.now().plusMillis(refreshTokenExpiry))
            .revoked(false)
            .build();
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    private LoginResponse buildLoginResponse(User user, String accessToken, String refreshToken) {
        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setName(user.getName());
        userInfo.setEmail(user.getEmail());
        userInfo.setRole(user.getRole());
        userInfo.setOrganization(user.getOrganization());
        userInfo.setAvatar(user.getAvatar());

        LoginResponse response = new LoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtUtil.getAccessTokenExpiry());
        response.setUser(userInfo);
        return response;
    }
}
