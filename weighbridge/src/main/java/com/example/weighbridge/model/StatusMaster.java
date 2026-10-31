
package com.example.weighbridge.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_statuses")
public class StatusMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "status_code", nullable = false,
            unique = true, length = 20)
    private String statusCode;

    @Column(name = "status_name", nullable = false, length = 100)
    private String statusName;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    public StatusMaster() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
