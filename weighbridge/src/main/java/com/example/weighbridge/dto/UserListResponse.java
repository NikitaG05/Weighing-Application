
package com.example.weighbridge.dto;

public record UserListResponse(
    Long id,
    String username,
    String role,
    Boolean enabled
) {}
