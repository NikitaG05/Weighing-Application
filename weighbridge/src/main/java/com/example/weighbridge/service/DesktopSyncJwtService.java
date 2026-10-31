
package com.example.weighbridge.service;

import com.example.weighbridge.dto.DesktopSyncLoginResponseDTO;
import com.example.weighbridge.service.DesktopSyncAuthService.AuthenticatedSyncClient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class DesktopSyncJwtService {

    private static final Duration TOKEN_VALIDITY =
            Duration.ofMinutes(15);

    private final JwtEncoder jwtEncoder;
    private final String jwtIssuer;

    public DesktopSyncJwtService(
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.issuer}") String jwtIssuer) {

        this.jwtEncoder = jwtEncoder;
        this.jwtIssuer = jwtIssuer;
    }

    public DesktopSyncLoginResponseDTO generateToken(
            AuthenticatedSyncClient client) {

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(TOKEN_VALIDITY);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtIssuer)
                .subject("desktop-sync:" + client.clientId())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("roles", List.of("DESKTOP_SYNC"))
                .claim("clientId", client.clientId())
                .claim("clientCode", client.clientCode())
                .claim("siteId", client.siteId())
                .claim("tokenType", "DESKTOP_SYNC")
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        String token = jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();

        LocalDateTime expiryDateTime =
                LocalDateTime.ofInstant(
                        expiresAt,
                        ZoneId.systemDefault()
                );

        return new DesktopSyncLoginResponseDTO(
                token,
                "Bearer",
                client.clientId(),
                client.clientCode(),
                client.siteId(),
                TOKEN_VALIDITY.toSeconds(),
                expiryDateTime
        );
    }
}
