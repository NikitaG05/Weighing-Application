package com.example.weighbridge.dto;

public record UnitMasterResponseDTO(

    Long id,
    String unitCode,
    String unitName,
    Long statusId,
    String statusCode,
    String statusName

) {}