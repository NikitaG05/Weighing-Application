
package com.example.weighbridge.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PartyMasterResponseDTO(

    Long id,
    Long siteId,
    String partyCode,
    String partyType,
    String partyName,
    String addressLine1,
    String addressLine2,
    String city,
    String pincode,
    String mobileNo,
    String emailId,
    String gstNo,
    BigDecimal charges,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {}
