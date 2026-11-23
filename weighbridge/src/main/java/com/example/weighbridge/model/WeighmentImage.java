package com.example.weighbridge.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "weighment_images",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_weighment_image_type",
        columnNames = {"weighment_id", "image_type"}
    )
)
public class WeighmentImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "weighment_id", nullable = false)
    private WeighmentRecord weighment;

    @Column(name = "image_type", nullable = false, length = 50)
    private String imageType;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "checksum", nullable = false, length = 64)
    private String checksum;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WeighmentRecord getWeighment() {
        return weighment;
    }

    public void setWeighment(WeighmentRecord weighment) {
        this.weighment = weighment;
    }

    public String getImageType() {
        return imageType;
    }

    public void setImageType(String imageType) {
        this.imageType = imageType;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getChecksum() {
        return checksum;
    }

    public void setChecksum(String checksum) {
        this.checksum = checksum;
    }
}
