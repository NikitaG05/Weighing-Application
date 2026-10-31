package com.example.weighbridge.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductMasterRequestDTO(
    @NotBlank @Size(max = 30) String productCode,
    @NotBlank @Size(max = 150) String productName,
    @NotNull Long unitId,
    @NotNull Long productTypeId,
    @NotNull @DecimalMin(value = "0.00") @Digits(integer = 13, fraction = 2) BigDecimal rate,
    @NotNull Long statusId
) {}
