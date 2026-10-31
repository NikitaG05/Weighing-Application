
package com.example.weighbridge.repository;

import com.example.weighbridge.model.IndiaPostalDirectory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IndiaPostalDirectoryRepository
        extends JpaRepository<IndiaPostalDirectory, Long> {

    @Query("""
        SELECT p
        FROM IndiaPostalDirectory p
        WHERE LOWER(p.district) LIKE LOWER(CONCAT('%', :city, '%'))
           OR LOWER(p.officeName) LIKE LOWER(CONCAT('%', :city, '%'))
        ORDER BY p.district, p.officeName, p.pincode
        """)
    List<IndiaPostalDirectory> searchByCity(
            @Param("city") String city
    );

        // Exact district or post-office lookup for Party Master
        @Query("""
            SELECT p
            FROM IndiaPostalDirectory p
            WHERE LOWER(TRIM(p.district)) = LOWER(TRIM(:city))
            OR LOWER(TRIM(p.officeName)) = LOWER(TRIM(:city))
            ORDER BY p.district, p.officeName, p.pincode
            """)
        List<IndiaPostalDirectory> findExactCityMatches(
                @Param("city") String city
        );
}
