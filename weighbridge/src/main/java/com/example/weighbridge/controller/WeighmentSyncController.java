
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.WeighmentSyncRequestDTO;
import com.example.weighbridge.dto.WeighmentSyncResponseDTO;
import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.repository.SiteRepository;
import com.example.weighbridge.service.WeighmentSyncService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/weighment-sync")
@PreAuthorize("hasRole('ADMIN')")
public class WeighmentSyncController {

    private final WeighmentSyncService syncService;
    private final LoginRepository loginRepository;
    private final SiteRepository siteRepository;

    public WeighmentSyncController(
            WeighmentSyncService syncService,
            LoginRepository loginRepository,
            SiteRepository siteRepository) {

        this.syncService = syncService;
        this.loginRepository = loginRepository;
        this.siteRepository = siteRepository;
    }

    private Long requireAuthorizedSiteId(
            Long siteId,
            Authentication authentication) {

        if (siteId == null || siteId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valid site ID is required"
            );
        }

        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        String username = authentication.getName();

        AdminLogin user = loginRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Authenticated user not found"
                        )
                );

        if (!user.isEnabled()
                || !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User is not authorized"
            );
        }

        siteRepository
        .findById(siteId)
        .orElseThrow(() ->
                new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Weighbridge site not found"
                )
        );

        return siteId;
    }

    @PostMapping
    public ResponseEntity<WeighmentSyncResponseDTO> sync(
            @Valid @RequestBody WeighmentSyncRequestDTO request,
            Authentication authentication) {

        Long authorizedSiteId =
                requireAuthorizedSiteId(
                        request.siteId(),
                        authentication
                );

        WeighmentSyncResponseDTO response =
                syncService.sync(
                        request,
                        authorizedSiteId
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<WeighmentSyncResponseDTO>>
    getBySite(
            @PathVariable Long siteId,
            Authentication authentication) {

        Long authorizedSiteId =
                requireAuthorizedSiteId(
                        siteId,
                        authentication
                );

        return ResponseEntity.ok(
                syncService.getBySite(authorizedSiteId)
        );
    }

    @GetMapping("/site/{siteId}/completed")
    public ResponseEntity<List<WeighmentSyncResponseDTO>>
    getCompletedBySite(
            @PathVariable Long siteId,
            Authentication authentication) {

        Long authorizedSiteId =
                requireAuthorizedSiteId(
                        siteId,
                        authentication
                );

        return ResponseEntity.ok(
                syncService.getCompletedBySite(
                        authorizedSiteId
                )
        );
    }

    @GetMapping(
        "/site/{siteId}/transaction/{sourceTransactionId}"
    )
    public ResponseEntity<WeighmentSyncResponseDTO>
    getBySourceTransaction(
            @PathVariable Long siteId,
            @PathVariable Integer sourceTransactionId,
            Authentication authentication) {

        Long authorizedSiteId =
                requireAuthorizedSiteId(
                        siteId,
                        authentication
                );

        return ResponseEntity.ok(
                syncService.getBySourceTransaction(
                        authorizedSiteId,
                        sourceTransactionId
                )
        );
    }
}
