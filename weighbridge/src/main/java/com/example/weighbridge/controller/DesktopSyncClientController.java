
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.DesktopSyncClientRegistrationDTO;
import com.example.weighbridge.dto.DesktopSyncClientRegistrationResponseDTO;
import com.example.weighbridge.service.DesktopSyncClientRegistrationService;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/desktop-sync-clients")
@PreAuthorize("hasRole('ADMIN')")
public class DesktopSyncClientController {

    private final DesktopSyncClientRegistrationService
            registrationService;

    public DesktopSyncClientController(
            DesktopSyncClientRegistrationService registrationService) {

        this.registrationService = registrationService;
    }

    @PostMapping
    public ResponseEntity<DesktopSyncClientRegistrationResponseDTO>
            registerDesktopClient(
                    @Valid @RequestBody
                    DesktopSyncClientRegistrationDTO request) {

        DesktopSyncClientRegistrationResponseDTO response =
                registrationService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(response);
    }
}
