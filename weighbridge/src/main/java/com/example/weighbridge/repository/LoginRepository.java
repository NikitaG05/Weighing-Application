package com.example.weighbridge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.weighbridge.model.AdminLogin;

public interface LoginRepository
        extends JpaRepository<AdminLogin, Long> {

    Optional<AdminLogin> findByUsername(String username);
}