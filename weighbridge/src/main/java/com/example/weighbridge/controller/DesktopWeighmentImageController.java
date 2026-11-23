package com.example.weighbridge.controller;

import com.example.weighbridge.model.WeighmentImage;
import com.example.weighbridge.service.DesktopSyncClientValidationService;
import com.example.weighbridge.service.WeighmentImageService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/sync/weighments")
@PreAuthorize("hasRole('DESKTOP_SYNC')")
public class DesktopWeighmentImageController {

    private final WeighmentImageService imageService;
    private final DesktopSyncClientValidationService validationService;

    public DesktopWeighmentImageController(
            WeighmentImageService imageService,
            DesktopSyncClientValidationService validationService) {

        this.imageService = imageService;
        this.validationService = validationService;
    }

    @PostMapping(
            value = "/{sourceTransactionId}/images",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<Map<String, Object>> uploadImage(
            @PathVariable Integer sourceTransactionId,
            @RequestParam("imageType") String imageType,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        Long authorizedSiteId =
                validationService.validateAndGetSiteId(authentication);

        WeighmentImage image = imageService.uploadImage(
                authorizedSiteId,
                sourceTransactionId,
                imageType,
                file
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "siteId", authorizedSiteId,
                "sourceTransactionId", sourceTransactionId,
                "imageType", image.getImageType(),
                "checksum", image.getChecksum()
        ));
    }
}