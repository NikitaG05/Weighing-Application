
package com.example.weighbridge.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

public record DesktopSyncClientRegistrationResponseDTO(

        Long id,

        String clientCode,

        Long siteId,

        String clientSecret,

        boolean enabled,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt

) {
}
