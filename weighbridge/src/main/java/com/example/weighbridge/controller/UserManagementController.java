
package com.example.weighbridge.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.weighbridge.service.UserManagementService;
import com.example.weighbridge.service.UserManagementService.UpdateUserRequest;
import com.example.weighbridge.service.UserManagementService.UserDetailsResponse;

@RestController
@RequestMapping("/api/admin/users")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(
            UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/{id}")
    public UserDetailsResponse getUserById(@PathVariable Long id) {
        return userManagementService.getUserById(id);
    }

    @PutMapping("/{id}")
    public UserDetailsResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request,
            Authentication authentication) {

        return userManagementService.updateUser(
            id, request, authentication
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @PathVariable Long id,
            Authentication authentication) {

        userManagementService.deleteUser(id, authentication);
    }
}
