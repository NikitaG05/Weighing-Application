
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.DesktopSyncLoginRequestDTO;
import com.example.weighbridge.dto.DesktopSyncLoginResponseDTO;
import com.example.weighbridge.service.DesktopSyncAuthService;
import com.example.weighbridge.service.DesktopSyncJwtService;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync/auth")
public class DesktopSyncAuthController {

    private final DesktopSyncAuthService authService;
    private final DesktopSyncJwtService jwtService;

    public DesktopSyncAuthController(
            DesktopSyncAuthService authService,
            DesktopSyncJwtService jwtService) {

        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<DesktopSyncLoginResponseDTO> login(
            @Valid @RequestBody DesktopSyncLoginRequestDTO request) {

        DesktopSyncAuthService.AuthenticatedSyncClient client =
                authService.authenticate(
                        request.clientCode(),
                        request.clientSecret()
                );

        DesktopSyncLoginResponseDTO response =
                jwtService.generateToken(client);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(response);
    }
}
