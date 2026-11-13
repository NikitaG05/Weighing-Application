
package com.example.weighbridge.service;

import com.example.weighbridge.dto.DesktopActivationRequestDTO;
import com.example.weighbridge.dto.DesktopActivationResponseDTO;
import com.example.weighbridge.model.DesktopActivation;
import com.example.weighbridge.model.DesktopSyncClient;
import com.example.weighbridge.repository.DesktopActivationRepository;
import com.example.weighbridge.repository.DesktopSyncClientRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class DesktopActivationService {

    private static final long OFFLINE_DAYS = 30;

    private final DesktopSyncAuthService authService;
    private final DesktopSyncClientRepository clientRepository;
    private final DesktopActivationRepository activationRepository;
    private final DesktopActivationSigningService signingService;

    public DesktopActivationService(
            DesktopSyncAuthService authService,
            DesktopSyncClientRepository clientRepository,
            DesktopActivationRepository activationRepository,
            DesktopActivationSigningService signingService) {

        this.authService = authService;
        this.clientRepository = clientRepository;
        this.activationRepository = activationRepository;
        this.signingService = signingService;
    }

    @Transactional
    public DesktopActivationResponseDTO activate(
            DesktopActivationRequestDTO request) {

        var authenticated = authService.authenticate(
                request.clientCode(),
                request.clientSecret()
        );

        DesktopSyncClient client = clientRepository
        .findByIdForUpdate(authenticated.clientId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Desktop client not found"
                ));

        DesktopActivation activation = activationRepository
                .findByClientId(client.getId())
                .orElse(null);

        Instant now = Instant.now();

        if (activation != null) {

            if (activation.isRevoked()) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Desktop activation has been revoked"
                );
            }

            if (!activation.getDeviceId().equals(request.deviceId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Client code is already activated on another computer"
                );
            }

        } else {

            activation = new DesktopActivation();
            activation.setClientId(client.getId());
            activation.setDeviceId(request.deviceId());
            activation.setActivatedAt(now);
        }

        Instant validUntil = now.plus(
                OFFLINE_DAYS,
                ChronoUnit.DAYS
        );

        activation.setOfflineValidUntil(validUntil);
        activationRepository.save(activation);

        String token = signingService.sign(
                client.getId(),
                client.getClientCode(),
                authenticated.siteId(),
                request.deviceId(),
                now,
                validUntil
        );

        return new DesktopActivationResponseDTO(
                client.getClientCode(),
                authenticated.siteId(),
                request.deviceId(),
                now,
                validUntil,
                token
        );
    }

    @Transactional
    public DesktopActivationResponseDTO renew(
            DesktopActivationRequestDTO request) {

        // Uses the same authenticated, device-bound checks.
        // A different device cannot renew the authorization.
        return activate(request);
    }
}
