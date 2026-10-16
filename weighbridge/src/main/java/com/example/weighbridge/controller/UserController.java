package com.example.weighbridge.controller;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/me")
    public Map<String, String> getCurrentUser(
            @AuthenticationPrincipal Jwt jwt) {

        return Map.of(
            "username", jwt.getSubject(),
            "message", "User access verified"
        );
    }
}