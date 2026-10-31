
package com.example.weighbridge.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.weighbridge.model.AddressMaster;

@Repository
public interface AddressRepository
        extends JpaRepository<AddressMaster, Long> {

    boolean existsByCityIgnoreCaseAndStateIgnoreCaseAndPincode(
        String city,
        String state,
        String pincode
    );
    
}
