package com.example.weighbridge.controller;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/me")
    public Map<String, String> getCurrentAdmin(
            @AuthenticationPrincipal Jwt jwt) {

        return Map.of(
            "username", jwt.getSubject(),
            "message", "Admin access verified"
        );
    }
}