
package com.example.weighbridge.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VehicleMasterResponseDTO(

    Long id,
    Long siteId,
    String vehicleNo,
    Long partyId,
    String partyName,
    String driverName,
    BigDecimal tareWeight,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {}
