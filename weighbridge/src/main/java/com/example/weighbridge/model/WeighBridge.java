
package com.example.weighbridge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "weighbridge")
public class WeighBridge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "weighbridge_name", nullable = false)
    private String weighbridgeName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private SiteMaster site;

    @Column(name = "total_trips", nullable = false)
    private Long totalTrips = 0L;

    public WeighBridge() {
    }

    public WeighBridge(
            Long id,
            String weighbridgeName,
            SiteMaster site,
            Long totalTrips
    ) {
        this.id = id;
        this.weighbridgeName = weighbridgeName;
        this.site = site;
        this.totalTrips = totalTrips == null ? 0L : totalTrips;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWeighbridgeName() {
        return weighbridgeName;
    }

    public void setWeighbridgeName(String weighbridgeName) {
        this.weighbridgeName = weighbridgeName;
    }

    public SiteMaster getSite() {
        return site;
    }

    public void setSite(SiteMaster site) {
        this.site = site;
    }

    public Long getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(Long totalTrips) {
        this.totalTrips = totalTrips;
    }
}
