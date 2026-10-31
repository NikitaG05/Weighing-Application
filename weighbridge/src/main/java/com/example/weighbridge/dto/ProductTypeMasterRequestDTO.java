
package com.example.weighbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductTypeMasterRequestDTO(

    @NotBlank(message = "Product type code is required")
    @Size(
        max = 30,
        message = "Product type code cannot exceed 30 characters"
    )
    String typeCode,

    @NotBlank(message = "Product type name is required")
    @Size(
        max = 100,
        message = "Product type name cannot exceed 100 characters"
    )
    String typeName,

    @NotNull(message = "Status ID is required")
    Long statusId

) {}
