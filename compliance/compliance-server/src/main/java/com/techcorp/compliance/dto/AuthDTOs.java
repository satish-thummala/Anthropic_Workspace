package com.techcorp.compliance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// ─── REQUEST DTOs ──────────────────────────────────────────────────────────────

public class AuthDTOs {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }

    @Data
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    // ─── RESPONSE DTOs ─────────────────────────────────────────────────────────

    @Data
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
        private UserInfo user;

        @Data
        public static class UserInfo {
            private Long id;
            private String name;
            private String email;
            private String role;
            private String organization;
            private String avatar;
        }
    }

    @Data
    public static class TokenRefreshResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;
    }

    @Data
    public static class ApiResponse {
        private boolean success;
        private String message;

        public ApiResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }
    }

    @Data
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private long timestamp;

        public ErrorResponse(int status, String error, String message) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
