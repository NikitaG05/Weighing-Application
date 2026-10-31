package com.example.weighbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UnitMasterRequestDTO(

    @NotBlank(message = "Unit code is required")
    @Size(max = 30, message = "Unit code cannot exceed 30 characters")
    String unitCode,

    @NotBlank(message = "Unit name is required")
    @Size(max = 100, message = "Unit name cannot exceed 100 characters")
    String unitName,

    @NotNull(message = "Status ID is required")
    Long statusId

) {}