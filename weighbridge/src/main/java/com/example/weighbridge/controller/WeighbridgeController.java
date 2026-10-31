
package com.example.weighbridge.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.weighbridge.dto.WeighBridgeRequestDTO;
import com.example.weighbridge.dto.WeighBridgeResponseDTO;
import com.example.weighbridge.service.WeighBridgeService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/weighbridges")
public class WeighbridgeController {

    private final WeighBridgeService weighBridgeService;

    public WeighbridgeController(
            WeighBridgeService weighBridgeService) {
        this.weighBridgeService = weighBridgeService;
    }

    // Register a new weighbridge
    @PostMapping
    public ResponseEntity<WeighBridgeResponseDTO> register(
            @Valid @RequestBody WeighBridgeRequestDTO request) {

        WeighBridgeResponseDTO response =
                weighBridgeService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // Fetch all registered weighbridges
    @GetMapping
    public ResponseEntity<List<WeighBridgeResponseDTO>> getAll() {

        List<WeighBridgeResponseDTO> weighbridges =
                weighBridgeService.getAll();

        return ResponseEntity.ok(weighbridges);
    }

    // Fetch weighbridge details by ID
    @GetMapping("/{id}")
    public ResponseEntity<WeighBridgeResponseDTO> getById(
            @PathVariable Long id) {

        WeighBridgeResponseDTO response =
                weighBridgeService.getById(id);

        return ResponseEntity.ok(response);
    }

    // Update weighbridge name or assigned site
    @PutMapping("/{id}")
    public ResponseEntity<WeighBridgeResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody WeighBridgeRequestDTO request) {

        WeighBridgeResponseDTO response =
                weighBridgeService.update(id, request);

        return ResponseEntity.ok(response);
    }

    // Delete a registered weighbridge
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        weighBridgeService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
