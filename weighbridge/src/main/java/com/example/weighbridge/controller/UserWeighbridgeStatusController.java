package com.example.weighbridge.controller;

import com.example.weighbridge.dto.WeighbridgeStatusResponseDTO;
import com.example.weighbridge.service.UserWeighbridgeStatusService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/weighbridge-status")
@PreAuthorize("hasRole('USER')")
public class UserWeighbridgeStatusController {

    private final UserWeighbridgeStatusService statusService;

    public UserWeighbridgeStatusController(
            UserWeighbridgeStatusService statusService) {
        this.statusService = statusService;
    }

    @GetMapping
    public ResponseEntity<List<WeighbridgeStatusResponseDTO>> getStatus(
            Authentication authentication) {

        return ResponseEntity.ok(
                statusService.getStatus(authentication.getName())
        );
    }
}
