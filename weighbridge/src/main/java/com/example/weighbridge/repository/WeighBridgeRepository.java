
package com.example.weighbridge.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.weighbridge.model.WeighBridge;

public interface WeighBridgeRepository
        extends JpaRepository<WeighBridge, Long> {
            
}
