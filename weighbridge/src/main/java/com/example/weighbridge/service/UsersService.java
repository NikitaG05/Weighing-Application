
package com.example.weighbridge.service;

import com.example.weighbridge.model.Users;
import com.example.weighbridge.repository.UsersRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class UsersService {

    private final UsersRepository usersRepository;

    public UsersService(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    // Create user
    public Users createUser(Users user) {

        user.setId(null);
        normalizeUser(user);

        if (usersRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Email already exists"
            );
        }

        return usersRepository.save(user);
    }

    // Get all users
    public List<Users> getAllUsers() {
        return usersRepository.findAll();
    }

    // Get user by ID
    public Users getUserById(Long id) {
        return usersRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "User not found"
            ));
    }

    // Update user
    public Users updateUser(Long id, Users updatedUser) {

        Users existingUser = getUserById(id);
        normalizeUser(updatedUser);

        usersRepository.findByEmailIgnoreCase(updatedUser.getEmail())
            .filter(user -> !user.getId().equals(id))
            .ifPresent(user -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already exists"
                );
            });

        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setContact(updatedUser.getContact());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setRole(updatedUser.getRole());

        return usersRepository.save(existingUser);
    }

    // Delete user
    public void deleteUser(Long id) {

        Users user = getUserById(id);
        usersRepository.delete(user);
    }

    private void normalizeUser(Users user) {
        user.setFullName(user.getFullName().trim());
        user.setContact(user.getContact().trim());
        user.setEmail(
            user.getEmail().trim().toLowerCase(Locale.ROOT)
        );
        user.setRole(user.getRole().trim().toUpperCase(Locale.ROOT));

        if (!user.getRole().equals("USER") &&
            !user.getRole().equals("ADMIN")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Role must be USER or ADMIN"
            );
        }
    }
}
