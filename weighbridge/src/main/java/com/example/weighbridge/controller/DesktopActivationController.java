
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.DesktopActivationRequestDTO;
import com.example.weighbridge.dto.DesktopActivationResponseDTO;
import com.example.weighbridge.service.DesktopActivationService;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activation")
public class DesktopActivationController {

    private final DesktopActivationService activationService;

    public DesktopActivationController(
            DesktopActivationService activationService) {
        this.activationService = activationService;
    }

    @PostMapping("/activate")
    public ResponseEntity<DesktopActivationResponseDTO> activate(
            @Valid @RequestBody DesktopActivationRequestDTO request) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(activationService.activate(request));
    }

    @PostMapping("/renew")
    public ResponseEntity<DesktopActivationResponseDTO> renew(
            @Valid @RequestBody DesktopActivationRequestDTO request) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(activationService.renew(request));
    }
}
