
package com.example.weighbridge.service;

import com.example.weighbridge.dto.DesktopSyncClientRegistrationDTO;
import com.example.weighbridge.dto.DesktopSyncClientRegistrationResponseDTO;
import com.example.weighbridge.model.DesktopSyncClient;
import com.example.weighbridge.repository.DesktopSyncClientRepository;
import com.example.weighbridge.repository.SiteRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class DesktopSyncClientRegistrationService {

    private static final SecureRandom SECURE_RANDOM =
            new SecureRandom();

    private final DesktopSyncClientRepository clientRepository;
    private final SiteRepository siteRepository;
    private final PasswordEncoder passwordEncoder;

    public DesktopSyncClientRegistrationService(
            DesktopSyncClientRepository clientRepository,
            SiteRepository siteRepository,
            PasswordEncoder passwordEncoder) {

        this.clientRepository = clientRepository;
        this.siteRepository = siteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public DesktopSyncClientRegistrationResponseDTO register(
            DesktopSyncClientRegistrationDTO request) {

        if (request == null
                || request.clientCode() == null
                || request.clientCode().isBlank()
                || request.clientCode().length() > 100
                || request.siteId() == null
                || request.siteId() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valid client code and site ID are required"
            );
        }

        String clientCode = request.clientCode().trim();

        if (!siteRepository.existsById(request.siteId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Weighbridge site not found"
            );
        }

        if (clientRepository.existsByClientCode(clientCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Desktop client code already exists"
            );
        }

        byte[] secretBytes = new byte[32];
        SECURE_RANDOM.nextBytes(secretBytes);

        String clientSecret = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(secretBytes);

        DesktopSyncClient client = new DesktopSyncClient();
        client.setClientCode(clientCode);
        client.setSiteId(request.siteId());
        client.setSecretHash(
                passwordEncoder.encode(clientSecret)
        );
        client.setEnabled(true);

        try {
            client = clientRepository.saveAndFlush(client);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Desktop client could not be registered",
                    ex
            );
        }

        return new DesktopSyncClientRegistrationResponseDTO(
                client.getId(),
                client.getClientCode(),
                client.getSiteId(),
                clientSecret,
                client.isEnabled(),
                client.getCreatedAt()
        );
    }
}
