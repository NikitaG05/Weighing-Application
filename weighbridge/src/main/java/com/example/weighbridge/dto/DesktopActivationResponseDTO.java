package com.example.weighbridge.dto;

import java.time.Instant;

public record DesktopActivationResponseDTO(

        String clientCode,
        Long siteId,
        String deviceId,
        Instant issuedAt,
        Instant offlineValidUntil,
        String activationToken

) {
}