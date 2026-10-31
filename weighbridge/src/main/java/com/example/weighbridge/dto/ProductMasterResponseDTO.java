package com.example.weighbridge.dto;

import java.math.BigDecimal;

public record ProductMasterResponseDTO(
    Long id,
    String productCode,
    String productName,
    Long unitId,
    String unitCode,
    String unitName,
    Long productTypeId,
    String typeCode,
    String typeName,
    BigDecimal rate,
    Long statusId,
    String statusCode,
    String statusName
) {}
