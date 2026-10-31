
package com.example.weighbridge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.weighbridge.model.RoleMaster;

@Repository
public interface RoleRepository
        extends JpaRepository<RoleMaster, Long> {

    Optional<RoleMaster> findByRoleCode(String roleCode);

    boolean existsByRoleCode(String roleCode);

    List<RoleMaster> findByEnabledTrueOrderByRoleNameAsc();
}
