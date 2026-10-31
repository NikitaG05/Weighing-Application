
package com.example.weighbridge.repository;

import com.example.weighbridge.model.ProductTypeMaster;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductTypeMasterRepository
        extends JpaRepository<ProductTypeMaster, Long> {

    // Find product type by unique code
    Optional<ProductTypeMaster> findByTypeCode(String typeCode);

    // Check duplicate code during creation
    boolean existsByTypeCode(String typeCode);

    // Check duplicate code during update
    boolean existsByTypeCodeAndIdNot(
            String typeCode,
            Long id
    );

    // Retrieve all product types alphabetically
    List<ProductTypeMaster> findAllByOrderByTypeNameAsc();

    // Retrieve product types by Status Master code
    List<ProductTypeMaster> findByStatus_StatusCodeOrderByTypeNameAsc(
            String statusCode
    );
}
