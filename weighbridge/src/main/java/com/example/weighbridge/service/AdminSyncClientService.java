
package com.example.weighbridge.service;

import com.example.weighbridge.model.DesktopSyncClient;
import com.example.weighbridge.repository.DesktopSyncClientRepository;
import com.example.weighbridge.repository.SiteRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class AdminSyncClientService {

    private final DesktopSyncClientRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final SiteRepository siteRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminSyncClientService(DesktopSyncClientRepository repository, PasswordEncoder passwordEncoder,
            SiteRepository siteRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.siteRepository = siteRepository;
    }

    private String generateSecret() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private DesktopSyncClient getClient(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Desktop sync client not found"
                ));
    }

    public record ClientResponse(
            Long id,
            String clientCode,
            Long siteId,
            boolean enabled,
            java.time.LocalDateTime createdAt,
            java.time.LocalDateTime lastSyncAt
    ) {}

    public record CredentialsResponse(
            Long id,
            String clientCode,
            String clientSecret,
            Long siteId
    ) {}

    private ClientResponse toResponse(DesktopSyncClient client) {
        return new ClientResponse(
                client.getId(),
                client.getClientCode(),
                client.getSiteId(),
                client.isEnabled(),
                client.getCreatedAt(),
                client.getLastSyncAt()
        );
    }

    @Transactional
public CredentialsResponse createClient(Long siteId) {

    if (siteId == null || siteId <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Valid siteId is required"
        );
    }

    if (!siteRepository.existsById(siteId)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Weighbridge site not found"
        );
    }

    String clientCode;

    do {
        clientCode = "TAREX-" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 16)
                        .toUpperCase();

    } while (repository.existsByClientCode(clientCode));

    String secret = generateSecret();

    DesktopSyncClient client = new DesktopSyncClient();

    client.setClientCode(clientCode);
    client.setSecretHash(passwordEncoder.encode(secret));
    client.setSiteId(siteId);
    client.setEnabled(true);

    DesktopSyncClient saved =
            repository.saveAndFlush(client);

    return new CredentialsResponse(
            saved.getId(),
            saved.getClientCode(),
            secret,
            saved.getSiteId()
    );
}

 @Transactional(readOnly = true)
    public List<ClientResponse> listClients() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClientResponse updateStatus(Long id, boolean enabled) {
        DesktopSyncClient client = getClient(id);
        client.setEnabled(enabled);
        return toResponse(repository.save(client));
    }

    @Transactional
    public CredentialsResponse rotateSecret(Long id) {
        DesktopSyncClient client = getClient(id);
        String secret = generateSecret();

        client.setSecretHash(passwordEncoder.encode(secret));
        repository.saveAndFlush(client);

        return new CredentialsResponse(
                client.getId(),
                client.getClientCode(),
                secret,
                client.getSiteId()
        );
    }
}
