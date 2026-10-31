
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
    name = "product_type_master",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_product_type_code",
            columnNames = "type_code"
        )
    }
)
public class ProductTypeMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "type_code",
        nullable = false,
        length = 30
    )
    private String typeCode;

    @Column(
        name = "type_name",
        nullable = false,
        length = 100
    )
    private String typeName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "status_id",
        nullable = false
    )
    private StatusMaster status;

    public ProductTypeMaster() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public void setTypeCode(String typeCode) {
        this.typeCode = typeCode;
    }

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public StatusMaster getStatus() {
        return status;
    }

    public void setStatus(StatusMaster status) {
        this.status = status;
    }
}
