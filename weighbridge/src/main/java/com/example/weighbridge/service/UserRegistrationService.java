
package com.example.weighbridge.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.repository.LoginRepository;

@Service
public class UserRegistrationService {

    private final LoginRepository loginRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private static final Pattern MOBILE_PATTERN =
        Pattern.compile("^[0-9]{10}$");

    public UserRegistrationService(
            LoginRepository loginRepository,
            PasswordEncoder passwordEncoder) {

        this.loginRepository = loginRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public record RegistrationResponse(
        Long id,
        String username,
        String fullName,
        String mobileNumber,
        String email,
        String role,
        String message
    ) {}

    @Transactional
    public RegistrationResponse register(
            String username,
            String password,
            String fullName,
            String mobileNumber,
            String email,
            String role) {

        String cleanUsername =
            username == null ? "" : username.trim();

        String cleanFullName =
            fullName == null ? "" : fullName.trim();

        String cleanMobile =
            mobileNumber == null ? "" : mobileNumber.trim();

        String cleanEmail =
            email == null ? "" :
                email.trim().toLowerCase(Locale.ROOT);

        String cleanRole =
            role == null ? "USER" : role.trim();

        // Validate username
        if (cleanUsername.isEmpty()
                || cleanUsername.length() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Username must contain 1 to 100 characters"
            );
        }

        // Validate password
        if (password == null
                || password.isBlank()
                || password.length() < 8
                || password.getBytes(StandardCharsets.UTF_8)
                    .length > 72) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Password must contain at least 8 characters and at most 72 UTF-8 bytes"
            );
        }

        // Validate full name
        if (cleanFullName.isEmpty()
                || cleanFullName.length() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Full name must contain 1 to 100 characters"
            );
        }

        // Validate mobile number
        if (!MOBILE_PATTERN.matcher(cleanMobile).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Mobile number must contain exactly 10 digits"
            );
        }

        // Validate email
        if (cleanEmail.length() > 150
                || !EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enter a valid email address"
            );
        }

        // Only supported roles
        if (!cleanRole.equals("USER")
                && !cleanRole.equals("ADMIN")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid user role"
            );
        }

        // Check duplicate username
        if (loginRepository.findByUsername(cleanUsername)
                .isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Username already exists"
            );
        }

        // Create user
        AdminLogin user = new AdminLogin();

        user.setUsername(cleanUsername);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(cleanFullName);
        user.setMobileNumber(cleanMobile);
        user.setEmail(cleanEmail);
        user.setRole(cleanRole);
        user.setEnabled(true);

        try {
            user = loginRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Account could not be created. Check for duplicate values."
            );
        }

        return new RegistrationResponse(
            user.getAdminId(),
            user.getUsername(),
            user.getFullName(),
            user.getMobileNumber(),
            user.getEmail(),
            user.getRole(),
            "User registered successfully"
        );
    }
}
