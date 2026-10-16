package com.example.weighbridge.service;

import java.nio.charset.StandardCharsets;

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

    public UserRegistrationService(
            LoginRepository loginRepository,
            PasswordEncoder passwordEncoder) {
        this.loginRepository = loginRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public record RegistrationResponse(
        Long id,
        String username,
        String role,
        String message
    ) {}

    @Transactional
    public RegistrationResponse register(String username, String password) {
        String cleanUsername = username == null ? "" : username.trim();

        if (cleanUsername.isEmpty() || cleanUsername.length() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Username must contain 1 to 100 characters"
            );
        }

        if (password == null || password.isBlank()
                || password.length() < 8
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Password must contain at least 8 characters and at most 72 UTF-8 bytes"
            );
        }

        if (loginRepository.findByUsername(cleanUsername).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Username already exists"
            );
        }

        AdminLogin user = new AdminLogin();
        user.setUsername(cleanUsername);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("USER");
        user.setEnabled(true);

        try {
            user = loginRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Account could not be created. Check whether the username already exists."
            );
        }

        return new RegistrationResponse(
            user.getAdminId(),
            user.getUsername(),
            user.getRole(),
            "User registered successfully"
        );
    }
}