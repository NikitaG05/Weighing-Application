package com.example.weighbridge.service;

import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.repository.LoginRepository;

@Service
public class LoginService {

    private final LoginRepository loginRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final String dummyPasswordHash;

    public LoginService(
            LoginRepository loginRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.issuer}") String issuer) {

        this.loginRepository = loginRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;

        // Used to perform a password check even when a user is absent.
        this.dummyPasswordHash =
            passwordEncoder.encode(java.util.UUID.randomUUID().toString());
    }

    public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String username,
        String role
    ) {}

    @Transactional(readOnly = true)
    public LoginResponse login(String username, String password) {

        if (username == null || username.isBlank()
                || username.length() > 100
                || password == null || password.isBlank()
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8)
                    .length > 72) {
            throw invalidLogin();
        }

        AdminLogin admin = loginRepository
            .findByUsername(username.trim())
            .orElse(null);

        String storedHash = admin == null
            ? dummyPasswordHash
            : admin.getPasswordHash();

        boolean passwordMatches =
            passwordEncoder.matches(password, storedHash);

        if (admin == null || !passwordMatches
                    || !admin.isEnabled()
                    || !List.of("ADMIN", "USER").contains(admin.getRole())) {
                throw invalidLogin();
            }

        Instant now = Instant.now();
        long expiresIn = 8 * 60 * 60; // 8 hours = 28800 seconds

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(issuer)
            .subject(admin.getUsername())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiresIn))
            .claim("roles", List.of(admin.getRole()))
            .build();

        JwsHeader header = JwsHeader
            .with(MacAlgorithm.HS256)
            .build();

        String token = jwtEncoder.encode(
            JwtEncoderParameters.from(header, claims)
        ).getTokenValue();

        return new LoginResponse(
            token,
            "Bearer",
            expiresIn,
            admin.getUsername(),
            admin.getRole()
        );
    }

    private ResponseStatusException invalidLogin() {
        return new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Invalid username or password"
        );
    }
}