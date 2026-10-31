
package com.example.weighbridge.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.weighbridge.service.SiteService;
import com.example.weighbridge.service.SiteService.SiteRequest;
import com.example.weighbridge.service.SiteService.SiteResponse;
import com.example.weighbridge.service.SiteService.SiteUserOption;

@RestController
@RequestMapping("/api/admin/sites")
@PreAuthorize("hasRole('ADMIN')")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    // Fetch usernames for Site Master dropdown
    @GetMapping("/users")
    public ResponseEntity<List<SiteUserOption>> getAvailableUsers() {
        return ResponseEntity.ok(
                siteService.getAvailableUsers()
        );
    }

    // Fetch all sites
    @GetMapping
    public ResponseEntity<List<SiteResponse>> getAllSites() {
        return ResponseEntity.ok(
                siteService.getAllSites()
        );
    }

    // Fetch site by ID
    @GetMapping("/{id}")
    public ResponseEntity<SiteResponse> getSiteById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                siteService.getSiteById(id)
        );
    }

    // Create site
    @PostMapping
    public ResponseEntity<SiteResponse> createSite(
            @RequestBody SiteRequest request) {

        SiteResponse site = siteService.createSite(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(site);
    }

    // Update site
    @PutMapping("/{id}")
    public ResponseEntity<SiteResponse> updateSite(
            @PathVariable Long id,
            @RequestBody SiteRequest request) {

        return ResponseEntity.ok(
                siteService.updateSite(id, request)
        );
    }

    // Delete site
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSite(
            @PathVariable Long id) {

        siteService.deleteSite(id);

        return ResponseEntity.noContent().build();
    }
}
