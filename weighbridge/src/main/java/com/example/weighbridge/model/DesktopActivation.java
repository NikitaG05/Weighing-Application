
package com.example.weighbridge.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "desktop_activations",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_activation_client",
            columnNames = "client_id"
        )
    }
)
public class DesktopActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "device_id", nullable = false, length = 128)
    private String deviceId;

    @Column(name = "activated_at", nullable = false)
    private Instant activatedAt;

    @Column(name = "offline_valid_until", nullable = false)
    private Instant offlineValidUntil;

    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) {
        this.activatedAt = activatedAt;
    }

    public Instant getOfflineValidUntil() {
        return offlineValidUntil;
    }
    public void setOfflineValidUntil(Instant offlineValidUntil) {
        this.offlineValidUntil = offlineValidUntil;
    }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) {
        this.revoked = revoked;
    }
}
