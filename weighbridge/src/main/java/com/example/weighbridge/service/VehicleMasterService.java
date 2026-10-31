
package com.example.weighbridge.service;

import com.example.weighbridge.dto.VehicleMasterRequestDTO;
import com.example.weighbridge.dto.VehicleMasterResponseDTO;
import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.model.PartyMaster;
import com.example.weighbridge.model.VehicleMaster;
import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.repository.PartyMasterRepository;
import com.example.weighbridge.repository.SiteRepository;
import com.example.weighbridge.repository.VehicleMasterRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class VehicleMasterService {

    private final VehicleMasterRepository vehicleRepository;
    private final PartyMasterRepository partyRepository;
    private final SiteRepository siteRepository;
    private final LoginRepository loginRepository;

    public VehicleMasterService(
            VehicleMasterRepository vehicleRepository,
            PartyMasterRepository partyRepository,
            SiteRepository siteRepository,
            LoginRepository loginRepository) {

        this.vehicleRepository = vehicleRepository;
        this.partyRepository = partyRepository;
        this.siteRepository = siteRepository;
        this.loginRepository = loginRepository;
    }

    // Identify the authenticated cloud user.
    private AdminLogin getCurrentUser(Jwt jwt) {

        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication required"
            );
        }

        return loginRepository
            .findByUsername(jwt.getSubject())
            .filter(AdminLogin::isEnabled)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authenticated user not found"
            ));
    }

    // Check whether the user can access the requested site.
    private void validateSiteAccess(Jwt jwt, Long siteId) {

        if (siteId == null || siteId <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Valid Site ID is required"
            );
        }

        AdminLogin user = getCurrentUser(jwt);

        if ("ADMIN".equals(user.getRole())) {
            if (!siteRepository.existsById(siteId)) {
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Site not found"
                );
            }
            return;
        }

        if (!"USER".equals(user.getRole())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Access denied"
            );
        }

        siteRepository
            .findByIdAndUserId(siteId, user.getAdminId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not have access to this site"
            ));
    }

    // Normalize vehicle numbers for consistent matching.
    private String normalizeVehicleNo(String vehicleNo) {

        if (vehicleNo == null || vehicleNo.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Vehicle number is required"
            );
        }

        String normalized = vehicleNo
            .replaceAll("\\s+", "")
            .toUpperCase(Locale.ROOT);

        if (normalized.isBlank() || normalized.length() > 30) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Vehicle number must contain 1 to 30 characters"
            );
        }

        return normalized;
    }

    // Find a Party that belongs to the same site.
    private PartyMaster resolveParty(Long siteId, Long partyId) {

        if (partyId == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Party ID is required"
            );
        }

        return partyRepository
            .findByIdAndSiteId(partyId, siteId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Selected Party does not belong to this site"
            ));
    }

    // Create or update a vehicle using site and vehicle number.
    @Transactional
    public VehicleMasterResponseDTO syncVehicle(
            Jwt jwt,
            VehicleMasterRequestDTO request) {

        if (request == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Vehicle information is required"
            );
        }

        validateSiteAccess(jwt, request.siteId());

        String vehicleNo = normalizeVehicleNo(request.vehicleNo());

        PartyMaster party = resolveParty(
            request.siteId(),
            request.partyId()
        );

        if (request.tareWeight() != null
                && request.tareWeight().signum() < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Tare weight cannot be negative"
            );
        }

        VehicleMaster vehicle = vehicleRepository
            .findBySiteIdAndVehicleNo(request.siteId(), vehicleNo)
            .orElseGet(VehicleMaster::new);

        vehicle.setSiteId(request.siteId());
        vehicle.setVehicleNo(vehicleNo);
        vehicle.setParty(party);
        vehicle.setDriverName(request.driverName());
        vehicle.setTareWeight(request.tareWeight());

        return toResponse(vehicleRepository.save(vehicle));
    }

    // Retrieve all vehicles belonging to an authorized site.
    @Transactional(readOnly = true)
    public List<VehicleMasterResponseDTO> getVehicles(
            Jwt jwt,
            Long siteId) {

        validateSiteAccess(jwt, siteId);

        return vehicleRepository
            .findBySiteIdOrderByVehicleNoAsc(siteId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // Retrieve one vehicle within the authorized site.
    @Transactional(readOnly = true)
    public VehicleMasterResponseDTO getVehicleById(
            Jwt jwt,
            Long siteId,
            Long vehicleId) {

        validateSiteAccess(jwt, siteId);

        VehicleMaster vehicle = vehicleRepository
            .findByIdAndSiteId(vehicleId, siteId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Vehicle not found"
            ));

        return toResponse(vehicle);
    }

    // Return vehicle data with its Party name.
    private VehicleMasterResponseDTO toResponse(
            VehicleMaster vehicle) {

        return new VehicleMasterResponseDTO(
            vehicle.getId(),
            vehicle.getSiteId(),
            vehicle.getVehicleNo(),
            vehicle.getParty().getId(),
            vehicle.getParty().getPartyName(),
            vehicle.getDriverName(),
            vehicle.getTareWeight(),
            vehicle.getCreatedAt(),
            vehicle.getUpdatedAt()
        );
    }
}
