package com.example.weighbridge.repository;

import com.example.weighbridge.model.ProductMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductMasterRepository extends JpaRepository<ProductMaster, Long> {
    boolean existsByProductCode(String productCode);
    boolean existsByProductCodeAndIdNot(String productCode, Long id);
    List<ProductMaster> findAllByOrderByProductNameAsc();
    List<ProductMaster> findByStatus_StatusCodeOrderByProductNameAsc(String statusCode);
}
