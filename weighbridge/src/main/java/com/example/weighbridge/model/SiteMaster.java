
package com.example.weighbridge.model;

import jakarta.persistence.*;

@Entity
@Table(name = "site_master")
public class SiteMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "site_name", nullable = false, length = 150)
    private String siteName;

    @Column(name = "address_id", nullable = false)
    private Long addressId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public SiteMaster() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
