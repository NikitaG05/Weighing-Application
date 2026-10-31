
package com.example.weighbridge.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VehicleMasterRequestDTO(

    @NotNull(message = "Site ID is required")
    Long siteId,

    @NotBlank(message = "Vehicle number is required")
    @Size(max = 50)
    String vehicleNo,

    @NotNull(message = "Party ID is required")
    Long partyId,

    @Size(max = 150)
    String driverName,

    @DecimalMin(
        value = "0.00",
        message = "Tare weight cannot be negative"
    )
    BigDecimal tareWeight

) {}
