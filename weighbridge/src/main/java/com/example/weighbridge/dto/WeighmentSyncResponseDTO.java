
package com.example.weighbridge.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

public record WeighmentSyncResponseDTO(

    Long id,

    Long siteId,

    Integer sourceTransactionId,

    String ticketNo,

    String wbName,

    String vehicleNo,

    String partyName,

    String productName,

    BigDecimal grossWeight,

    BigDecimal tareWeight,

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

    String shiftName,

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime syncedAt

) {}
