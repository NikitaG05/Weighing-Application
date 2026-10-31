
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.UserListResponse;
import com.example.weighbridge.service.UserListService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class UserListController {

    private final UserListService userListService;

    public UserListController(UserListService userListService) {
        this.userListService = userListService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserListResponse>> getAllUsers() {

        return ResponseEntity.ok(
            userListService.getAllUsers()
        );
    }
}
