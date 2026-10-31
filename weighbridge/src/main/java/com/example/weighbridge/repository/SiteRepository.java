
package com.example.weighbridge.repository;

import com.example.weighbridge.model.SiteMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository
        extends JpaRepository<SiteMaster, Long> {

    // Fetch sites assigned to a particular client
    List<SiteMaster> findByUserId(Long userId);

    // Verify that a site belongs to a particular client
    Optional<SiteMaster> findByIdAndUserId(
            Long id,
            Long userId
    );
}
