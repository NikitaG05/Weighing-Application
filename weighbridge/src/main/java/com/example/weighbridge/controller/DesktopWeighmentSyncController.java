
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.WeighmentSyncRequestDTO;
import com.example.weighbridge.dto.WeighmentSyncResponseDTO;
import com.example.weighbridge.service.DesktopSyncClientValidationService;
import com.example.weighbridge.service.WeighmentSyncService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync/weighments")
@PreAuthorize("hasRole('DESKTOP_SYNC')")
public class DesktopWeighmentSyncController {

    private final WeighmentSyncService syncService;
    private final DesktopSyncClientValidationService validationService;

    public DesktopWeighmentSyncController(
            WeighmentSyncService syncService,
            DesktopSyncClientValidationService validationService) {

        this.syncService = syncService;
        this.validationService = validationService;
    }

    @PostMapping
public ResponseEntity<WeighmentSyncResponseDTO> syncWeighment(
        @Valid @RequestBody WeighmentSyncRequestDTO request,
        Authentication authentication) {

    Long authorizedSiteId =
            validationService.validateAndGetSiteId(authentication);

    WeighmentSyncResponseDTO response =
            syncService.sync(request, authorizedSiteId);

    return ResponseEntity.ok(response);
}
        @GetMapping("/{sourceTransactionId}")
        public ResponseEntity<WeighmentSyncResponseDTO> getWeighment(
                @PathVariable Integer sourceTransactionId,
                Authentication authentication) {

                Long authorizedSiteId =
                        validationService.validateAndGetSiteId(authentication);

                WeighmentSyncResponseDTO response =
                        syncService.getBySourceTransactionForDesktop(
                                authorizedSiteId,
                                sourceTransactionId
                        );

                return ResponseEntity.ok(response);
        }
}
