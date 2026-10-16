package com.example.weighbridge.model;

import jakarta.persistence.*;

@Entity
@Table(name = "AppUsers", schema = "dbo")
public class AdminLogin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Long adminId;

    @Column(name = "Username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "PasswordHash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "Role", nullable = false, length = 20)
    private String role;

    @Column(name = "Enabled", nullable = false)
    private boolean enabled;

    public AdminLogin() {
    }

    public Long getAdminId() {
        return adminId;
    }

    public void setAdminId(Long adminId) {
        this.adminId = adminId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}