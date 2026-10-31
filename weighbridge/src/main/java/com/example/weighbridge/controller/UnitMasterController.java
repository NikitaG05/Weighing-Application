package com.example.weighbridge.controller;

import com.example.weighbridge.dto.UnitMasterRequestDTO;
import com.example.weighbridge.dto.UnitMasterResponseDTO;
import com.example.weighbridge.service.UnitMasterService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class UnitMasterController {

    private final UnitMasterService unitMasterService;

    public UnitMasterController(UnitMasterService unitMasterService) {
        this.unitMasterService = unitMasterService;
    }

    // Get all units - ADMIN and USER
    @GetMapping("/api/units")
    public ResponseEntity<List<UnitMasterResponseDTO>> getAllUnits() {

        return ResponseEntity.ok(
                unitMasterService.getAllUnits()
        );
    }

    // Get active units - ADMIN and USER
    @GetMapping("/api/units/active")
    public ResponseEntity<List<UnitMasterResponseDTO>> getActiveUnits() {

        return ResponseEntity.ok(
                unitMasterService.getActiveUnits()
        );
    }

    // Get unit by ID - ADMIN and USER
    @GetMapping("/api/units/{id}")
    public ResponseEntity<UnitMasterResponseDTO> getUnitById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                unitMasterService.getUnitById(id)
        );
    }

    // Create unit - ADMIN only
    @PostMapping("/api/admin/units")
    public ResponseEntity<UnitMasterResponseDTO> createUnit(
            @Valid @RequestBody UnitMasterRequestDTO request) {

        UnitMasterResponseDTO response =
                unitMasterService.createUnit(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // Update unit - ADMIN only
    @PutMapping("/api/admin/units/{id}")
    public ResponseEntity<UnitMasterResponseDTO> updateUnit(
            @PathVariable Long id,
            @Valid @RequestBody UnitMasterRequestDTO request) {

        return ResponseEntity.ok(
                unitMasterService.updateUnit(id, request)
        );
    }

    // Delete unit - ADMIN only
    @DeleteMapping("/api/admin/units/{id}")
    public ResponseEntity<Void> deleteUnit(
            @PathVariable Long id) {

        unitMasterService.deleteUnit(id);

        return ResponseEntity.noContent().build();
    }
}