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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "unit_master",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_unit_code",
            columnNames = "unit_code"
        )
    }
)
public class UnitMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "unit_code",
        nullable = false,
        length = 30
    )
    private String unitCode;

    @Column(
        name = "unit_name",
        nullable = false,
        length = 100
    )
    private String unitName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "status_id",
        nullable = false
    )
    private StatusMaster status;

    public UnitMaster() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public String getUnitName() {
        return unitName;
    }

    public void setUnitName(String unitName) {
        this.unitName = unitName;
    }

    public StatusMaster getStatus() {
        return status;
    }

    public void setStatus(StatusMaster status) {
        this.status = status;
    }
}