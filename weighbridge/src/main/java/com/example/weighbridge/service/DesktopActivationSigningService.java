
package com.example.weighbridge.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
public class DesktopActivationSigningService {

    private final PrivateKey privateKey;

    public DesktopActivationSigningService(
            @Value("${app.activation.private-key}") String pem) {

        try {
            String key = pem
                    .replace("\\n", "\n")
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");

            byte[] decoded = Base64.getDecoder().decode(key);

            this.privateKey = KeyFactory.getInstance("RSA")
                    .generatePrivate(
                            new PKCS8EncodedKeySpec(decoded)
                    );

        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Invalid activation signing private key", ex
            );
        }
    }

    public String sign(
            Long clientId,
            String clientCode,
            Long siteId,
            String deviceId,
            Instant issuedAt,
            Instant validUntil) {

        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .issuer("tarex-activation")
                    .subject(clientId.toString())
                    .claim("clientCode", clientCode)
                    .claim("siteId", siteId)
                    .claim("deviceId", deviceId)
                    .issueTime(Date.from(issuedAt))
                    .expirationTime(Date.from(validUntil))
                    .build();

            SignedJWT jwt = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.RS256),
                    claims
            );

            jwt.sign(new RSASSASigner(privateKey));

            return jwt.serialize();

        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to sign desktop activation", ex
            );
        }
    }
}
