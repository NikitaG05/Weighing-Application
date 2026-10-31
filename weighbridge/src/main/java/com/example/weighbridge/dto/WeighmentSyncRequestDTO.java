
package com.example.weighbridge.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record WeighmentSyncRequestDTO(

    @NotNull(message = "Source transaction ID is required")
    @Positive(message = "Source transaction ID must be positive")
    Integer sourceTransactionId,

    @NotNull(message = "Site ID is required")
    @Positive(message = "Site ID must be positive")
    Long siteId,

    @Positive(message = "Source revision must be positive")
    Long sourceRevision,

    @NotBlank(message = "Ticket number is required")
    String ticketNo,

    String wbName,

    String vehicleNo,

    String partyName,

    String productName,

    @NotNull(message = "Gross weight is required")
    @DecimalMin(value = "0.0", message = "Gross weight cannot be negative")
    BigDecimal grossWeight,

    @NotNull(message = "Tare weight is required")
    @DecimalMin(value = "0.0", message = "Tare weight cannot be negative")
    BigDecimal tareWeight,

    @DecimalMin(value = "0.0", message = "Net weight cannot be negative")
    BigDecimal netWeight,

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime ticketDate,

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime grossDate,

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime tareDate,

    String status,

    Boolean completed,

    Boolean deleted,

    String operatorName,

    String shiftName

) {}
