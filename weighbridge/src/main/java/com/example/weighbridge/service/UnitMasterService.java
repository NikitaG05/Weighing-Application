
package com.example.weighbridge.service;

import com.example.weighbridge.dto.UnitMasterRequestDTO;
import com.example.weighbridge.dto.UnitMasterResponseDTO;
import com.example.weighbridge.model.StatusMaster;
import com.example.weighbridge.model.UnitMaster;
import com.example.weighbridge.repository.StatusRepository;
import com.example.weighbridge.repository.UnitMasterRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class UnitMasterService {

    private static final Set<String> ALLOWED_STATUSES =
            Set.of("ACTIVE", "INACTIVE");

    private final UnitMasterRepository unitRepository;
    private final StatusRepository statusRepository;

    public UnitMasterService(
            UnitMasterRepository unitRepository,
            StatusRepository statusRepository) {

        this.unitRepository = unitRepository;
        this.statusRepository = statusRepository;
    }

    // Retrieve all units
    @Transactional(readOnly = true)
    public List<UnitMasterResponseDTO> getAllUnits() {

        return unitRepository.findAllByOrderByUnitNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Retrieve only ACTIVE units
    @Transactional(readOnly = true)
    public List<UnitMasterResponseDTO> getActiveUnits() {

        return unitRepository
                .findByStatus_StatusCodeOrderByUnitNameAsc("ACTIVE")
                .stream()
                .filter(unit -> unit.getStatus().isEnabled())
                .map(this::toResponse)
                .toList();
    }

    // Retrieve unit by ID
    @Transactional(readOnly = true)
    public UnitMasterResponseDTO getUnitById(Long id) {

        return toResponse(findUnit(id));
    }

    // Create a new unit
    @Transactional
    public UnitMasterResponseDTO createUnit(
            UnitMasterRequestDTO request) {

        String code = normalizeCode(request.unitCode());
        String name = normalizeName(request.unitName());

        StatusMaster status = validateStatus(request.statusId());

        if (unitRepository.existsByUnitCode(code)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Unit code already exists: " + code
            );
        }

        UnitMaster unit = new UnitMaster();

        unit.setUnitCode(code);
        unit.setUnitName(name);
        unit.setStatus(status);

        UnitMaster savedUnit = unitRepository.saveAndFlush(unit);

        return toResponse(savedUnit);
    }

    // Update an existing unit
    @Transactional
    public UnitMasterResponseDTO updateUnit(
            Long id,
            UnitMasterRequestDTO request) {

        UnitMaster unit = findUnit(id);

        String code = normalizeCode(request.unitCode());
        String name = normalizeName(request.unitName());

        StatusMaster status = validateStatus(request.statusId());

        if (unitRepository.existsByUnitCodeAndIdNot(code, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Unit code already exists: " + code
            );
        }

        unit.setUnitCode(code);
        unit.setUnitName(name);
        unit.setStatus(status);

        UnitMaster updatedUnit = unitRepository.saveAndFlush(unit);

        return toResponse(updatedUnit);
    }

    // Delete a unit
    @Transactional
    public void deleteUnit(Long id) {

        UnitMaster unit = findUnit(id);

        try {
            unitRepository.delete(unit);
            unitRepository.flush();

        } catch (DataIntegrityViolationException ex) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Unit cannot be deleted because it is in use",
                    ex
            );
        }
    }

    // Find unit or return 404
    private UnitMaster findUnit(Long id) {

        return unitRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Unit not found with ID: " + id
                        )
                );
    }

    // Validate Status Master reference
    private StatusMaster validateStatus(Long statusId) {

        if (statusId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status ID is required"
            );
        }

        StatusMaster status = statusRepository.findById(statusId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Invalid status ID: " + statusId
                        )
                );

        String statusCode = status.getStatusCode()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!ALLOWED_STATUSES.contains(statusCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only ACTIVE and INACTIVE statuses are allowed"
            );
        }

        if (!status.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected status is disabled"
            );
        }

        return status;
    }

    // Normalize unit code
    private String normalizeCode(String code) {

        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unit code is required"
            );
        }

        String normalized = code.trim()
                .toUpperCase(Locale.ROOT);

        if (normalized.length() > 30) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unit code cannot exceed 30 characters"
            );
        }

        return normalized;
    }

    // Normalize unit name
    private String normalizeName(String name) {

        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unit name is required"
            );
        }

        String normalized = name.trim();

        if (normalized.length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unit name cannot exceed 100 characters"
            );
        }

        return normalized;
    }

    // Convert entity to response DTO
    private UnitMasterResponseDTO toResponse(UnitMaster unit) {

        StatusMaster status = unit.getStatus();

        return new UnitMasterResponseDTO(
                unit.getId(),
                unit.getUnitCode(),
                unit.getUnitName(),
                status.getId(),
                status.getStatusCode(),
                status.getStatusName()
        );
    }
}
