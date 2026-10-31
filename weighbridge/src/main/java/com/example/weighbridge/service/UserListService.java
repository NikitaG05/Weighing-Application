
package com.example.weighbridge.service;

import com.example.weighbridge.dto.UserListResponse;
import com.example.weighbridge.repository.LoginRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserListService {

    private final LoginRepository loginRepository;

    public UserListService(LoginRepository loginRepository) {
        this.loginRepository = loginRepository;
    }

    public List<UserListResponse> getAllUsers() {

        return loginRepository.findAll()
            .stream()
            .map(user -> new UserListResponse(
                user.getAdminId(),
                user.getUsername(),
                user.getRole(),
                user.isEnabled()
            ))
            .toList();
    }
}
