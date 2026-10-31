
package com.example.weighbridge.repository;

import com.example.weighbridge.model.PartyMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartyMasterRepository
        extends JpaRepository<PartyMaster, Long> {

    // Fetch all parties belonging to a specific site
    List<PartyMaster> findBySiteIdOrderByPartyNameAsc(
            Long siteId
    );

    // Find a party using its site and desktop party code
    Optional<PartyMaster> findBySiteIdAndPartyCode(
            Long siteId,
            String partyCode
    );

    // Check whether a party code already exists at a site
    boolean existsBySiteIdAndPartyCode(
            Long siteId,
            String partyCode
    );

    // Search parties by name within a specific site
    List<PartyMaster> findBySiteIdAndPartyNameContainingIgnoreCase(
            Long siteId,
            String partyName
    );

    // Search parties by city within a specific site
    List<PartyMaster> findBySiteIdAndCityContainingIgnoreCase(
            Long siteId,
            String city
    );

    // Find a specific party only within its site
    Optional<PartyMaster> findByIdAndSiteId(
            Long id,
            Long siteId
    );
}
