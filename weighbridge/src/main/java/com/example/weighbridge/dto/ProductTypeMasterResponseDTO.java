
package com.example.weighbridge.dto;

public record ProductTypeMasterResponseDTO(

    Long id,
    String typeCode,
    String typeName,
    Long statusId,
    String statusCode,
    String statusName

) {}
