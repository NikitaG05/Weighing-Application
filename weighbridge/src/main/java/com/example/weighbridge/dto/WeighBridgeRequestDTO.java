
package com.example.weighbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class WeighBridgeRequestDTO {

    @NotBlank(message = "Weighbridge name is required")
    private String weighbridgeName;

    @NotNull(message = "Site is required")
    private Long siteId;

    public WeighBridgeRequestDTO() {
    }

    public String getWeighbridgeName() {
        return weighbridgeName;
    }

    public void setWeighbridgeName(String weighbridgeName) {
        this.weighbridgeName = weighbridgeName;
    }

    public Long getSiteId() {
        return siteId;
    }

    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }
}
