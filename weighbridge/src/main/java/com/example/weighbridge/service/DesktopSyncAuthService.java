
package com.example.weighbridge.service;

import com.example.weighbridge.model.DesktopSyncClient;
import com.example.weighbridge.repository.DesktopSyncClientRepository;
import com.example.weighbridge.repository.SiteRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class DesktopSyncAuthService {

    private final DesktopSyncClientRepository clientRepository;
    private final SiteRepository siteRepository;
    private final PasswordEncoder passwordEncoder;
    private final String dummySecretHash;

    public DesktopSyncAuthService(
            DesktopSyncClientRepository clientRepository,
            SiteRepository siteRepository,
            PasswordEncoder passwordEncoder) {

        this.clientRepository = clientRepository;
        this.siteRepository = siteRepository;
        this.passwordEncoder = passwordEncoder;

        this.dummySecretHash = passwordEncoder.encode(
                UUID.randomUUID().toString()
        );
    }

    @Transactional(readOnly = true)
    public AuthenticatedSyncClient authenticate(
            String clientCode,
            String clientSecret) {

        if (clientCode == null
                || clientCode.isBlank()
                || clientCode.length() > 100
                || clientSecret == null
                || clientSecret.isBlank()
                || clientSecret.getBytes(StandardCharsets.UTF_8)
                        .length > 72) {

            throw invalidCredentials();
        }

        DesktopSyncClient client = clientRepository
                .findByClientCode(clientCode)
                .orElse(null);

        String storedHash = client == null
                ? dummySecretHash
                : client.getSecretHash();

        boolean secretMatches = passwordEncoder.matches(
                clientSecret,
                storedHash
        );

        if (client == null
                || !secretMatches
                || !client.isEnabled()) {

            throw invalidCredentials();
        }

        Long siteId = client.getSiteId();

        if (siteId == null
                || !siteRepository.existsById(siteId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Desktop client site is not available"
            );
        }

        return new AuthenticatedSyncClient(
                client.getId(),
                client.getClientCode(),
                siteId
        );
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid desktop synchronization credentials"
        );
    }

    public record AuthenticatedSyncClient(
            Long clientId,
            String clientCode,
            Long siteId
    ) {
    }
}
