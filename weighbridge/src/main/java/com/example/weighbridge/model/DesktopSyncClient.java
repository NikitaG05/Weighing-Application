
package com.example.weighbridge.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "desktop_sync_clients",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_desktop_sync_client_code",
            columnNames = "client_code"
        )
    }
)
public class DesktopSyncClient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "client_code",
        nullable = false,
        length = 100
    )
    private String clientCode;

    @Column(
        name = "secret_hash",
        nullable = false,
        length = 255
    )
    private String secretHash;

    @Column(
        name = "site_id",
        nullable = false
    )
    private Long siteId;

    @Column(
        name = "enabled",
        nullable = false
    )
    private boolean enabled = true;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public DesktopSyncClient() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClientCode() {
        return clientCode;
    }

    public void setClientCode(String clientCode) {
        this.clientCode = clientCode;
    }

    public String getSecretHash() {
        return secretHash;
    }

    public void setSecretHash(String secretHash) {
        this.secretHash = secretHash;
    }

    public Long getSiteId() {
        return siteId;
    }

    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }

    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
