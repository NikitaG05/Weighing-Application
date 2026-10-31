
package com.example.weighbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record DesktopSyncClientRegistrationDTO(

        @NotBlank(message = "Client code is required")
        @Size(
                max = 100,
                message = "Client code cannot exceed 100 characters"
        )
        String clientCode,

        @NotNull(message = "Site ID is required")
        @Positive(message = "Site ID must be positive")
        Long siteId

) {
}
