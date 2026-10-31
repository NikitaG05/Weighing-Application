package com.example.weighbridge.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_master", uniqueConstraints = @UniqueConstraint(name = "uk_product_master_code", columnNames = "product_code"))
public class ProductMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", nullable = false, length = 30)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_unit"))
    private UnitMaster unit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_type"))
    private ProductTypeMaster productType;

    @Column(name = "rate", nullable = false, precision = 15, scale = 2)
    private BigDecimal rate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "status_id", nullable = false, foreignKey = @ForeignKey(name = "fk_product_status"))
    private StatusMaster status;

    public ProductMaster() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public UnitMaster getUnit() { return unit; }
    public void setUnit(UnitMaster unit) { this.unit = unit; }
    public ProductTypeMaster getProductType() { return productType; }
    public void setProductType(ProductTypeMaster productType) { this.productType = productType; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public StatusMaster getStatus() { return status; }
    public void setStatus(StatusMaster status) { this.status = status; }
}
