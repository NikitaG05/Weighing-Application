
package com.example.weighbridge.service;

import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.repository.LoginRepository;

@Service
public class UserManagementService {

    private final LoginRepository loginRepository;

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private static final Pattern MOBILE_PATTERN =
        Pattern.compile("^[0-9]{10}$");

    public UserManagementService(LoginRepository loginRepository) {
        this.loginRepository = loginRepository;
    }

    public record UserDetailsResponse(
        Long id,
        String username,
        String fullName,
        String mobileNumber,
        String email,
        String role,
        boolean enabled
    ) {}

    public record UpdateUserRequest(
        String username,
        String fullName,
        String mobileNumber,
        String email,
        String role,
        Boolean enabled
    ) {}

    @Transactional(readOnly = true)
    public UserDetailsResponse getUserById(Long id) {
        return toResponse(findUser(id));
    }

    @Transactional
    public UserDetailsResponse updateUser(
            Long id,
            UpdateUserRequest request,
            Authentication authentication) {

        AdminLogin user = findUser(id);

        String username = required(request.username(), "Username", 100);
        String fullName = required(request.fullName(), "Full name", 100);
        String mobile = required(request.mobileNumber(), "Mobile number", 10);
        String email = required(request.email(), "Email", 150)
            .toLowerCase(Locale.ROOT);
        String role = required(request.role(), "Role", 20)
            .toUpperCase(Locale.ROOT);

        if (!MOBILE_PATTERN.matcher(mobile).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Mobile number must contain exactly 10 digits"
            );
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enter a valid email address"
            );
        }

        if (!role.equals("ADMIN") && !role.equals("USER")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Role must be ADMIN or USER"
            );
        }

        if (request.enabled() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enabled status is required"
            );
        }

        boolean currentUser =
            authentication != null
            && user.getUsername().equals(authentication.getName());

        if (currentUser &&
            (!request.enabled() || !role.equals("ADMIN"))) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "You cannot deactivate or remove your own admin access"
            );
        }

        loginRepository.findByUsername(username).ifPresent(existing -> {
            if (!existing.getAdminId().equals(id)) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username already exists"
                );
            }
        });

        user.setUsername(username);
        user.setFullName(fullName);
        user.setMobileNumber(mobile);
        user.setEmail(email);
        user.setRole(role);
        user.setEnabled(request.enabled());

        return toResponse(loginRepository.saveAndFlush(user));
    }

    @Transactional
public void deleteUser(Long id, Authentication authentication) {

    // Step 1: Only ADMIN can delete users
    if (authentication == null ||
        authentication.getAuthorities().stream()
            .noneMatch(authority ->
                "ROLE_ADMIN".equals(authority.getAuthority()))) {

        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "Only ADMIN can delete users"
        );
    }

    // Step 2: Find the user
    AdminLogin user = findUser(id);

    // Step 3: Prevent deleting own account
    if (user.getUsername().equals(authentication.getName())) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "You cannot delete your own account"
        );
    }

    // Step 4: Protect ADMIN accounts
    if ("ADMIN".equalsIgnoreCase(user.getRole())) {
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "ADMIN accounts cannot be deleted"
        );
    }

    // Step 5: Delete regular USER account
    loginRepository.delete(user);
    loginRepository.flush();
}

    private AdminLogin findUser(Long id) {
        return loginRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "User not found"
            ));
    }

    private String required(String value, String field, int maxLength) {
        String clean = value == null ? "" : value.trim();

        if (clean.isEmpty() || clean.length() > maxLength) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                field + " must contain 1 to " + maxLength + " characters"
            );
        }

        return clean;
    }

    private UserDetailsResponse toResponse(AdminLogin user) {
        return new UserDetailsResponse(
            user.getAdminId(),
            user.getUsername(),
            user.getFullName(),
            user.getMobileNumber(),
            user.getEmail(),
            user.getRole(),
            user.isEnabled()
        );
    }
}
