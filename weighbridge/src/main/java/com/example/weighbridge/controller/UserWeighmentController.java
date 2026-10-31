
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.WeighmentSyncResponseDTO;
import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.repository.SiteRepository;
import com.example.weighbridge.service.WeighmentSyncService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/weighments")
@PreAuthorize("hasRole('USER')")
public class UserWeighmentController {

    private final WeighmentSyncService weighmentSyncService;
    private final LoginRepository loginRepository;
    private final SiteRepository siteRepository;

    public UserWeighmentController(
            WeighmentSyncService weighmentSyncService,
            LoginRepository loginRepository,
            SiteRepository siteRepository) {

        this.weighmentSyncService = weighmentSyncService;
        this.loginRepository = loginRepository;
        this.siteRepository = siteRepository;
    }

    // Validate the authenticated USER account.
    private AdminLogin requireAuthorizedUser(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        AdminLogin user = loginRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "User not found"
                        )
                );

        if (!user.isEnabled()
                || !"USER".equals(user.getRole())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "User account is not authorized"
            );
        }

        return user;
    }

    // Validate that the requested site belongs to the USER.
    private Long requireAuthorizedSiteId(
            Long siteId,
            Authentication authentication) {

        if (siteId == null || siteId <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valid site ID is required"
            );
        }

        AdminLogin user = requireAuthorizedUser(authentication);

        siteRepository
                .findByIdAndUserId(
                        siteId,
                        user.getAdminId()
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Access denied for this site"
                        )
                );

        return siteId;
    }

    // Get all sites assigned to the logged-in USER.
    @GetMapping("/sites")
    public ResponseEntity<List<Map<String, Object>>> getMySites(
            Authentication authentication) {

        AdminLogin user = requireAuthorizedUser(authentication);

        List<Map<String, Object>> sites = siteRepository
                .findByUserId(user.getAdminId())
                .stream()
                .map(site -> Map.<String, Object>of(
                        "id", site.getId(),
                        "siteName", site.getSiteName()
                ))
                .toList();

        return ResponseEntity.ok(sites);
    }

    // Get all non-deleted weighments for an authorized site.
    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<WeighmentSyncResponseDTO>> getBySite(
            @PathVariable Long siteId,
            Authentication authentication) {

        Long authorizedSiteId =
                requireAuthorizedSiteId(
                        siteId,
                        authentication
                );

        return ResponseEntity.ok(
                weighmentSyncService.getBySite(
                        authorizedSiteId
                )
        );
    }

    // Get completed weighments for an authorized site.
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
                weighmentSyncService.getCompletedBySite(
                        authorizedSiteId
                )
        );
    }

    // Get a specific weighment transaction.
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
                weighmentSyncService.getBySourceTransaction(
                        authorizedSiteId,
                        sourceTransactionId
                )
        );
    }
}
