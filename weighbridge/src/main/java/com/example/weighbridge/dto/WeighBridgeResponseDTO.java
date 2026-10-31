
package com.example.weighbridge.dto;

public class WeighBridgeResponseDTO {

    private Long id;
    private String weighbridgeName;
    private Long siteId;
    private String siteName;
    private String address;
    private Long totalTrips;

    public WeighBridgeResponseDTO() {
    }

    public WeighBridgeResponseDTO(
            Long id,
            String weighbridgeName,
            Long siteId,
            String siteName,
            String address,
            Long totalTrips) {

        this.id = id;
        this.weighbridgeName = weighbridgeName;
        this.siteId = siteId;
        this.siteName = siteName;
        this.address = address;
        this.totalTrips = totalTrips;
    }

    public Long getId() {
        return id;
    }

    public String getWeighbridgeName() {
        return weighbridgeName;
    }

    public Long getSiteId() {
        return siteId;
    }

    public String getSiteName() {
        return siteName;
    }

    public String getAddress() {
        return address;
    }

    public Long getTotalTrips() {
        return totalTrips;
    }
}
