
package com.example.weighbridge.service;

import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.model.StatusMaster;
import com.example.weighbridge.repository.StatusRepository;

@Service
public class StatusService {

    private final StatusRepository statusRepository;

    public StatusService(StatusRepository statusRepository) {
        this.statusRepository = statusRepository;
    }

    public record StatusRequest(
        String statusCode,
        String statusName,
        boolean enabled
    ) {}

    @Transactional(readOnly = true)
    public List<StatusMaster> getAllStatuses() {
        return statusRepository.findAll();
    }

    @Transactional(readOnly = true)
    public StatusMaster getStatusById(Long id) {
        return statusRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Status not found"
            ));
    }

    @Transactional
    public StatusMaster createStatus(StatusRequest request) {
        String code = normalizeCode(request.statusCode());
        String name = validateName(request.statusName());

        if (statusRepository.existsByStatusCode(code)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Status code already exists"
            );
        }

        StatusMaster status = new StatusMaster();
        status.setStatusCode(code);
        status.setStatusName(name);
        status.setEnabled(request.enabled());

        try {
            return statusRepository.saveAndFlush(status);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Status code already exists"
            );
        }
    }

    @Transactional
    public StatusMaster updateStatus(
            Long id,
            StatusRequest request) {

        StatusMaster status = getStatusById(id);

        String code = normalizeCode(request.statusCode());
        String name = validateName(request.statusName());

        // Status codes remain immutable.
        if (!status.getStatusCode().equals(code)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Status codes cannot be changed"
            );
        }

        // Protect the two system statuses.
        if (isSystemStatus(code) && !request.enabled()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "System statuses cannot be disabled"
            );
        }

        status.setStatusName(name);
        status.setEnabled(request.enabled());

        return statusRepository.saveAndFlush(status);
    }

    @Transactional
    public void deleteStatus(Long id) {
        StatusMaster status = getStatusById(id);

        if (isSystemStatus(status.getStatusCode())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "System statuses cannot be deleted"
            );
        }

        // Currently, app_users stores status as a boolean.
        // Additional statuses are definitions only until
        // account-status integration is implemented.
        statusRepository.delete(status);
        statusRepository.flush();
    }

    private String normalizeCode(String code) {
        String value = code == null ? "" :
            code.trim().toUpperCase(Locale.ROOT);

        if (!value.matches("[A-Z][A-Z0-9_]{0,19}")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Status code must start with a letter and contain only letters, numbers or underscores (maximum 20 characters)"
            );
        }

        return value;
    }

    private String validateName(String name) {
        String value = name == null ? "" : name.trim();

        if (value.isEmpty() || value.length() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Status name must contain 1 to 100 characters"
            );
        }

        return value;
    }

    private boolean isSystemStatus(String code) {
        return "ACTIVE".equals(code)
            || "INACTIVE".equals(code);
    }
}
