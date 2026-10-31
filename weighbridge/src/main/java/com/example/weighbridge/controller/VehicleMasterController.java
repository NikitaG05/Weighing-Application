
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.VehicleMasterRequestDTO;
import com.example.weighbridge.dto.VehicleMasterResponseDTO;
import com.example.weighbridge.service.VehicleMasterService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleMasterController {

    private final VehicleMasterService vehicleService;

    public VehicleMasterController(
            VehicleMasterService vehicleService) {
        this.vehicleService = vehicleService;
    }

    // Create or update a vehicle for desktop/cloud sync.
    @PostMapping("/sync")
    public ResponseEntity<VehicleMasterResponseDTO> syncVehicle(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VehicleMasterRequestDTO request) {

        return ResponseEntity.ok(
            vehicleService.syncVehicle(jwt, request)
        );
    }

    // Get all vehicles for a specific site.
    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<VehicleMasterResponseDTO>> getVehicles(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long siteId) {

        return ResponseEntity.ok(
            vehicleService.getVehicles(jwt, siteId)
        );
    }

    // Get one vehicle by site and vehicle ID.
    @GetMapping("/site/{siteId}/{vehicleId}")
    public ResponseEntity<VehicleMasterResponseDTO> getVehicleById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long siteId,
            @PathVariable Long vehicleId) {

        return ResponseEntity.ok(
            vehicleService.getVehicleById(jwt, siteId, vehicleId)
        );
    }
}
