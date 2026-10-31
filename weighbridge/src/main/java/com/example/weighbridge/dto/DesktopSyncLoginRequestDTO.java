
package com.example.weighbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DesktopSyncLoginRequestDTO(

        @NotBlank(message = "Client code is required")
        @Size(
                max = 100,
                message = "Client code cannot exceed 100 characters"
        )
        String clientCode,

        @NotBlank(message = "Client secret is required")
        String clientSecret

) {
}
