
package com.example.weighbridge.repository;

import com.example.weighbridge.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
