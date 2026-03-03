package com.techcorp.compliance.controller;

import com.techcorp.compliance.dto.UserDTOs.*;
import com.techcorp.compliance.entity.User;
import com.techcorp.compliance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;

    /**
     * GET /api/v1/users/me
     * Get current authenticated user's profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole());
        response.setOrganization(user.getOrganization());
        response.setAvatar(user.getAvatar());
        response.setEnabled(user.isEnabled());
        
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/v1/users/me
     * Update current user's profile
     */
    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateProfileRequest request) {
        
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        
        // Organization typically shouldn't be changed by user, but included for completeness
        if (request.getOrganization() != null) {
            user.setOrganization(request.getOrganization());
        }
        
        userRepository.save(user);
        log.info("Updated profile for user: {}", user.getEmail());
        
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole());
        response.setOrganization(user.getOrganization());
        response.setAvatar(user.getAvatar());
        response.setEnabled(user.isEnabled());
        
        return ResponseEntity.ok(response);
    }
}
