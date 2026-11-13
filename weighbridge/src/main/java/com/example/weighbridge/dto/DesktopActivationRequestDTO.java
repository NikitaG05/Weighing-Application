package com.example.weighbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DesktopActivationRequestDTO(

        @NotBlank
        @Size(max = 100)
        String clientCode,

        @NotBlank
        String clientSecret,

        @NotBlank
        @Size(max = 128)
        String deviceId

) {
}