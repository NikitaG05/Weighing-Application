
package com.example.weighbridge.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(
    name = "weighment_records",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_weighment_site_transaction",
            columnNames = {"site_id", "source_transaction_id"}
        )
    }
)
public class WeighmentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "site_id", nullable = false)
    private Long siteId;

    @Column(name = "source_transaction_id", nullable = false)
    private Integer sourceTransactionId;

    @Column(name = "source_revision")
    private Long sourceRevision;

    public Long getSourceRevision() {
        return sourceRevision;
    }

    public void setSourceRevision(Long sourceRevision) {
        this.sourceRevision = sourceRevision;
    }

    @Column(name = "ticket_no", length = 50)
    private String ticketNo;

    @Column(name = "wb_name", length = 100)
    private String wbName;

    @Column(name = "vehicle_no", length = 100)
    private String vehicleNo;

    @Column(name = "party_name", length = 200)
    private String partyName;

    @Column(name = "product_name", length = 200)
    private String productName;

    @Column(name = "gross_weight", precision = 18, scale = 3)
    private BigDecimal grossWeight;

    @Column(name = "tare_weight", precision = 18, scale = 3)
    private BigDecimal tareWeight;

    @Column(name = "net_weight", precision = 18, scale = 3)
    private BigDecimal netWeight;

    @Column(name = "ticket_date")
    private LocalDateTime ticketDate;

    @Column(name = "gross_date")
    private LocalDateTime grossDate;

    @Column(name = "tare_date")
    private LocalDateTime tareDate;

    @Column(name = "transaction_status", length = 50)
    private String status;

    @Column(name = "completed")
    private Boolean completed;

    @Column(name = "is_deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "operator_name", length = 100)
    private String operatorName;

    @Column(name = "shift_name", length = 100)
    private String shiftName;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @PrePersist
    @PreUpdate
    public void updateSyncTimestamp() {
        syncedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSiteId() {
        return siteId;
    }

    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }

    public Integer getSourceTransactionId() {
        return sourceTransactionId;
    }

    public void setSourceTransactionId(Integer sourceTransactionId) {
        this.sourceTransactionId = sourceTransactionId;
    }

    public String getTicketNo() {
        return ticketNo;
    }

    public void setTicketNo(String ticketNo) {
        this.ticketNo = ticketNo;
    }

    public String getWbName() {
        return wbName;
    }

    public void setWbName(String wbName) {
        this.wbName = wbName;
    }

    public String getVehicleNo() {
        return vehicleNo;
    }

    public void setVehicleNo(String vehicleNo) {
        this.vehicleNo = vehicleNo;
    }

    public String getPartyName() {
        return partyName;
    }

    public void setPartyName(String partyName) {
        this.partyName = partyName;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getGrossWeight() {
        return grossWeight;
    }

    public void setGrossWeight(BigDecimal grossWeight) {
        this.grossWeight = grossWeight;
    }

    public BigDecimal getTareWeight() {
        return tareWeight;
    }

    public void setTareWeight(BigDecimal tareWeight) {
        this.tareWeight = tareWeight;
    }

    public BigDecimal getNetWeight() {
        return netWeight;
    }

    public void setNetWeight(BigDecimal netWeight) {
        this.netWeight = netWeight;
    }

    public LocalDateTime getTicketDate() {
        return ticketDate;
    }

    public void setTicketDate(LocalDateTime ticketDate) {
        this.ticketDate = ticketDate;
    }

    public LocalDateTime getGrossDate() {
        return grossDate;
    }

    public void setGrossDate(LocalDateTime grossDate) {
        this.grossDate = grossDate;
    }

    public LocalDateTime getTareDate() {
        return tareDate;
    }

    public void setTareDate(LocalDateTime tareDate) {
        this.tareDate = tareDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public LocalDateTime getSyncedAt() {
        return syncedAt;
    }
}
