
package com.example.weighbridge.service;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.model.RoleMaster;
import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.repository.RoleRepository;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final LoginRepository loginRepository;

    public RoleService(
            RoleRepository roleRepository,
            LoginRepository loginRepository) {
        this.roleRepository = roleRepository;
        this.loginRepository = loginRepository;
    }

    public record RoleRequest(
        String roleCode,
        String roleName,
        boolean enabled
    ) {}

    @Transactional(readOnly = true)
    public List<RoleMaster> getAllRoles() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public RoleMaster getRoleById(Long id) {
        return roleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Role not found"
            ));
    }

    @Transactional
    public RoleMaster createRole(RoleRequest request) {
        String code = normalizeCode(request.roleCode());
        String name = validateName(request.roleName());

        if (roleRepository.existsByRoleCode(code)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Role code already exists"
            );
        }

        RoleMaster role = new RoleMaster();
        role.setRoleCode(code);
        role.setRoleName(name);
        role.setEnabled(request.enabled());

        return roleRepository.saveAndFlush(role);
    }

    @Transactional
    public RoleMaster updateRole(Long id, RoleRequest request) {
        RoleMaster role = getRoleById(id);
        String code = normalizeCode(request.roleCode());
        String name = validateName(request.roleName());

        // Keep system role codes immutable.
        if (!role.getRoleCode().equals(code)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Role codes cannot be changed"
            );
        }

        // Protect required authentication roles.
        if (isSystemRole(code) && !request.enabled()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "System roles cannot be disabled"
            );
        }

        role.setRoleName(name);
        role.setEnabled(request.enabled());

        return roleRepository.saveAndFlush(role);
    }

    @Transactional
    public void deleteRole(Long id) {
        RoleMaster role = getRoleById(id);
        String code = role.getRoleCode();

        if (isSystemRole(code)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "System roles cannot be deleted"
            );
        }

        // Check whether any account currently uses this role.
        boolean assigned = loginRepository.existsByRole(code);

        if (assigned) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Role is assigned to users and cannot be deleted"
            );
        }

        roleRepository.delete(role);
    }

    private String normalizeCode(String code) {
        String value = code == null ? "" :
            code.trim().toUpperCase(Locale.ROOT);

        if (!value.matches("[A-Z][A-Z0-9_]{0,19}")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Role code must start with a letter and contain only uppercase letters, numbers, or underscores (maximum 20 characters)"
            );
        }

        return value;
    }

    private String validateName(String name) {
        String value = name == null ? "" : name.trim();

        if (value.isEmpty() || value.length() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Role name must contain 1 to 100 characters"
            );
        }

        return value;
    }

    private boolean isSystemRole(String code) {
        return "ADMIN".equals(code) || "USER".equals(code);
    }
}
