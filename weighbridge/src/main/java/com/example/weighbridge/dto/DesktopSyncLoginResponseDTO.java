
package com.example.weighbridge.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record DesktopSyncLoginResponseDTO(

        String accessToken,

        String tokenType,

        Long clientId,

        String clientCode,

        Long siteId,

        Long expiresIn,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime expiresAt

) {
}
