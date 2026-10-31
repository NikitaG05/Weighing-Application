
package com.example.weighbridge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.weighbridge.model.StatusMaster;

@Repository
public interface StatusRepository
        extends JpaRepository<StatusMaster, Long> {

    Optional<StatusMaster> findByStatusCode(String statusCode);

    boolean existsByStatusCode(String statusCode);

    List<StatusMaster> findByEnabledTrueOrderByStatusNameAsc();
}
