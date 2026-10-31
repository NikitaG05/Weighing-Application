
package com.example.weighbridge.service;

import com.example.weighbridge.model.DesktopSyncClient;
import com.example.weighbridge.repository.DesktopSyncClientRepository;
import com.example.weighbridge.repository.SiteRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DesktopSyncClientValidationService {

    private final DesktopSyncClientRepository clientRepository;
    private final SiteRepository siteRepository;

    public DesktopSyncClientValidationService(
            DesktopSyncClientRepository clientRepository,
            SiteRepository siteRepository) {

        this.clientRepository = clientRepository;
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public Long validateAndGetSiteId(
            Authentication authentication) {

        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)
                || !authentication.isAuthenticated()) {

            throw forbidden();
        }

        boolean hasSyncRole = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_DESKTOP_SYNC"::equals);

        if (!hasSyncRole) {
            throw forbidden();
        }

        Jwt jwt = jwtAuth.getToken();

        if (!"DESKTOP_SYNC".equals(
                jwt.getClaimAsString("tokenType"))) {

            throw forbidden();
        }

        Long clientId = readPositiveLongClaim(jwt, "clientId");
        Long tokenSiteId = readPositiveLongClaim(jwt, "siteId");
        String tokenClientCode = jwt.getClaimAsString("clientCode");

        if (clientId == null
                || tokenSiteId == null
                || tokenClientCode == null
                || tokenClientCode.isBlank()) {

            throw forbidden();
        }

        if (!("desktop-sync:" + clientId)
                .equals(jwt.getSubject())) {

            throw forbidden();
        }

        DesktopSyncClient client = clientRepository
                .findById(clientId)
                .orElseThrow(this::forbidden);

        if (!client.isEnabled()) {
            throw forbidden();
        }

        if (!tokenSiteId.equals(client.getSiteId())) {
            throw forbidden();
        }

        if (!tokenClientCode.equals(client.getClientCode())) {
            throw forbidden();
        }

        if (!siteRepository.existsById(client.getSiteId())) {
            throw forbidden();
        }

        return client.getSiteId();
    }

    private Long readPositiveLongClaim(
            Jwt jwt,
            String claimName) {

        Object value = jwt.getClaim(claimName);

        if (!(value instanceof Number number)) {
            return null;
        }

        long result = number.longValue();

        if (result <= 0
                || Double.compare(
                        number.doubleValue(),
                        (double) result
                ) != 0) {

            return null;
        }

        return result;
    }

    private ResponseStatusException forbidden() {
        return new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Desktop synchronization client is not authorized"
        );
    }
}
