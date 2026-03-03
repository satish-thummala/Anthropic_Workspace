package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.AuthDTOs.*;
import com.techcorp.compliance.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/login
     * Authenticates user credentials and returns JWT access + refresh tokens.
     *
     * Request Body:
     * {
     *   "email": "admin@techcorp.com",
     *   "password": "Admin@123"
     * }
     *
     * Response:
     * {
     *   "accessToken": "eyJhbGci...",
     *   "refreshToken": "uuid-string",
     *   "tokenType": "Bearer",
     *   "expiresIn": 900000,
     *   "user": { "id", "name", "email", "role", "organization", "avatar" }
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/refresh
     * Issues a new access token using a valid refresh token (token rotation).
     *
     * Request Body:
     * { "refreshToken": "uuid-string" }
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/logout
     * Revokes all refresh tokens for the authenticated user.
     * Requires valid Bearer token in Authorization header.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully"));
    }

    /**
     * GET /api/v1/auth/me
     * Returns current authenticated user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(new ApiResponse(true, "Authenticated as: " + userDetails.getUsername()));
    }
}
