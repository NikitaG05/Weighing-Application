
package com.example.weighbridge.repository;

import com.example.weighbridge.model.VehicleMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleMasterRepository
        extends JpaRepository<VehicleMaster, Long> {

    // Find a vehicle by site and vehicle number.
    Optional<VehicleMaster> findBySiteIdAndVehicleNo(
            Long siteId,
            String vehicleNo
    );

    // Get all vehicles belonging to a site.
    List<VehicleMaster> findBySiteIdOrderByVehicleNoAsc(
            Long siteId
    );

    // Find one vehicle within a specific site.
    Optional<VehicleMaster> findByIdAndSiteId(
            Long id,
            Long siteId
    );

    // Check whether a vehicle number exists at a site.
    boolean existsBySiteIdAndVehicleNo(
            Long siteId,
            String vehicleNo
    );

    // Get vehicles associated with a particular Party.
    List<VehicleMaster> findBySiteIdAndParty_Id(
            Long siteId,
            Long partyId
    );
}
