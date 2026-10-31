
package com.example.weighbridge.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

        @NotBlank(message = "Username is required")
        @Size(max = 100, message = "Username must not exceed 100 characters")
        String username,

        @NotBlank(message = "Password is required")
        String password,

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @NotBlank(message = "Mobile number is required")
        @Pattern(
            regexp = "^[0-9]{10}$",
            message = "Mobile number must contain exactly 10 digits"
        )
        String mobileNumber,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 150, message = "Email must not exceed 150 characters")
        String email,

        @NotBlank(message = "Role is required")
        @Pattern(
            regexp = "^(ADMIN|USER)$",
            message = "Role must be ADMIN or USER"
        )
        String role

    ) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserRegistrationService.RegistrationResponse register(
            @Valid @RequestBody RegistrationRequest request) {

        return registrationService.register(
            request.username(),
            request.password(),
            request.fullName(),
            request.mobileNumber(),
            request.email(),
            request.role()
        );
    }
}
