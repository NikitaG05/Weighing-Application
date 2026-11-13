
package com.example.weighbridge.repository;

import com.example.weighbridge.model.DesktopActivation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DesktopActivationRepository
        extends JpaRepository<DesktopActivation, Long> {

    Optional<DesktopActivation> findByClientId(Long clientId);
}
