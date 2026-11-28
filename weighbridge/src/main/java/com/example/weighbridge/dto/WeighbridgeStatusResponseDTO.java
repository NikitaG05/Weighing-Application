package com.example.weighbridge.dto;

import java.time.Instant;
import java.time.LocalDateTime;

public record WeighbridgeStatusResponseDTO(
        Long weighbridgeId,
        String weighbridgeName,
        Long siteId,
        String siteName,
        String status,
        String connectionStatus,
        Instant validFrom,
        Instant validTo,
        Long renewalDays,
        Long totalTrips,
        Long storageUsedBytes,
        LocalDateTime lastSyncAt,
        LocalDateTime lastUpdated
) {
}
