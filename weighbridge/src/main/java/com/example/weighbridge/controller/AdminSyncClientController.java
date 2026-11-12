
package com.example.weighbridge.controller;

import com.example.weighbridge.service.AdminSyncClientService;
import com.example.weighbridge.service.AdminSyncClientService.ClientResponse;
import com.example.weighbridge.service.AdminSyncClientService.CredentialsResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sync-clients")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSyncClientController {

    private final AdminSyncClientService service;

    public AdminSyncClientController(
            AdminSyncClientService service) {
        this.service = service;
    }

    public record CreateClientRequest(
            @NotNull @Positive Long siteId
    ) {}

    public record UpdateStatusRequest(
            @NotNull Boolean enabled
    ) {}

    @PostMapping
    public ResponseEntity<CredentialsResponse> create(
            @Valid @RequestBody CreateClientRequest request) {

        CredentialsResponse response =
                service.createClient(request.siteId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<ClientResponse>> list() {
        return ResponseEntity.ok(service.listClients());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ClientResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {

        return ResponseEntity.ok(
                service.updateStatus(id, request.enabled())
        );
    }

    @PostMapping("/{id}/rotate-secret")
    public ResponseEntity<CredentialsResponse> rotateSecret(
            @PathVariable Long id) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(service.rotateSecret(id));
    }
}
