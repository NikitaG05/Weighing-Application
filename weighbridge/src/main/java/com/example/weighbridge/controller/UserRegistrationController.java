package com.example.weighbridge.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.example.weighbridge.service.UserRegistrationService;

@RestController
@RequestMapping("/api/admin/users")
public class UserRegistrationController {

    private final UserRegistrationService registrationService;

    public UserRegistrationController(
            UserRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    public record RegistrationRequest(
        @NotBlank @Size(max = 100) String username,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserRegistrationService.RegistrationResponse register(
            @Valid @RequestBody RegistrationRequest request) {

        return registrationService.register(
            request.username(),
            request.password()
        );
    }
}