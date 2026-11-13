
package com.example.weighbridge.repository;

import com.example.weighbridge.model.DesktopSyncClient;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesktopSyncClientRepository
        extends JpaRepository<DesktopSyncClient, Long> {

    // Find a desktop client by its unique client code
    Optional<DesktopSyncClient> findByClientCode(
            String clientCode
    );

    // Check whether a client code already exists
    boolean existsByClientCode(
            String clientCode
    );

    // Find all desktop clients assigned to a site
    List<DesktopSyncClient> findBySiteId(
            Long siteId
    );

    // Find enabled desktop clients for a site
    List<DesktopSyncClient> findBySiteIdAndEnabledTrue(
            Long siteId
    );

    boolean existsBySiteId(Long siteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT c FROM DesktopSyncClient c WHERE c.id = :clientId")
        Optional<DesktopSyncClient> findByIdForUpdate(
                @Param("clientId") Long clientId
        );
}
