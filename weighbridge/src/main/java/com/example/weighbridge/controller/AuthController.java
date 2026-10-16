package com.example.weighbridge.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.weighbridge.service.LoginService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final LoginService loginService;

    public AuthController(LoginService loginService) {
        this.loginService = loginService;
    }

    public record LoginRequest(
        @NotBlank @Size(max = 100) String username,
        @NotBlank @Size(max = 72) String password
    ) {}

    @PostMapping("/login")
    public LoginService.LoginResponse login(
            @Valid @RequestBody LoginRequest request) {

        return loginService.login(
            request.username(),
            request.password()
        );
    }
}