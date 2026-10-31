package com.example.weighbridge.repository;

import com.example.weighbridge.model.UnitMaster;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitMasterRepository
        extends JpaRepository<UnitMaster, Long> {

    // Find a unit by its unique code
    Optional<UnitMaster> findByUnitCode(String unitCode);

    // Check duplicate unit code during creation
    boolean existsByUnitCode(String unitCode);

    // Check duplicate unit code during update
    boolean existsByUnitCodeAndIdNot(
            String unitCode,
            Long id
    );

    // Retrieve all units alphabetically
    List<UnitMaster> findAllByOrderByUnitNameAsc();

    // Retrieve units with ACTIVE status
    List<UnitMaster> findByStatus_StatusCodeOrderByUnitNameAsc(
            String statusCode
    );
}