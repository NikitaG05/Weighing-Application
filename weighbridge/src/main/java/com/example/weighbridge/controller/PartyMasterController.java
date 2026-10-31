package com.example.weighbridge.controller;

import com.example.weighbridge.dto.PartyMasterRequestDTO;
import com.example.weighbridge.dto.PartyMasterResponseDTO;
import com.example.weighbridge.service.PartyMasterService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/parties")
public class PartyMasterController {

    private final PartyMasterService partyService;

    public PartyMasterController(
            PartyMasterService partyService) {
        this.partyService = partyService;
    }

    // Fetch all Parties for an authorized site.
    @GetMapping
    public ResponseEntity<List<PartyMasterResponseDTO>> getParties(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Long siteId) {

        return ResponseEntity.ok(
                partyService.getParties(jwt, siteId)
        );
    }

    // Fetch a specific Party for an authorized site.
    @GetMapping("/{partyId}")
    public ResponseEntity<PartyMasterResponseDTO> getPartyById(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam Long siteId,
            @PathVariable Long partyId) {

        return ResponseEntity.ok(
                partyService.getPartyById(jwt, siteId, partyId)
        );
    }

    // Create or update a Party using site ID and Party Code.
    @PostMapping("/sync")
    public ResponseEntity<PartyMasterResponseDTO> syncParty(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PartyMasterRequestDTO request) {

        return ResponseEntity.ok(
                partyService.syncParty(jwt, request)
        );
    }
}
