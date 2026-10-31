
package com.example.weighbridge.model;

import jakarta.persistence.*;

@Entity
@Table(name = "india_postal_directory")
public class IndiaPostalDirectory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "office_name")
    private String officeName;

    private String district;
    private String state;
    private String pincode;

    public Long getId() {
        return id;
    }

    public String getOfficeName() {
        return officeName;
    }

    public String getDistrict() {
        return district;
    }

    public String getState() {
        return state;
    }

    public String getPincode() {
        return pincode;
    }
}
