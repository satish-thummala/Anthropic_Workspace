package com.techcorp.compliance.dto;

import lombok.Data;

public class UserDTOs {

    @Data
    public static class UserProfileResponse {
        private Long id;
        private String email;
        private String name;
        private String role;
        private String organization;
        private String avatar;
        private boolean enabled;
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
        private String organization;
        private String avatar;
    }
}
