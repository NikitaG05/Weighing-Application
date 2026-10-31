
package com.example.weighbridge.service;

import com.example.weighbridge.dto.PartyMasterRequestDTO;
import com.example.weighbridge.dto.PartyMasterResponseDTO;
import com.example.weighbridge.model.AdminLogin;
import com.example.weighbridge.model.IndiaPostalDirectory;
import com.example.weighbridge.model.PartyMaster;
import com.example.weighbridge.repository.IndiaPostalDirectoryRepository;
import com.example.weighbridge.repository.LoginRepository;
import com.example.weighbridge.repository.PartyMasterRepository;
import com.example.weighbridge.repository.SiteRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class PartyMasterService {

    private final PartyMasterRepository partyRepository;
    private final SiteRepository siteRepository;
    private final LoginRepository loginRepository;
    private final IndiaPostalDirectoryRepository postalRepository;

    public PartyMasterService(
            PartyMasterRepository partyRepository,
            SiteRepository siteRepository,
            LoginRepository loginRepository,
            IndiaPostalDirectoryRepository postalRepository) {

        this.partyRepository = partyRepository;
        this.siteRepository = siteRepository;
        this.loginRepository = loginRepository;
        this.postalRepository = postalRepository;
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

    // Verify that the requested site belongs to this user.
    private void validateSiteAccess(Jwt jwt, Long siteId) {

        if (siteId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Site ID is required"
            );
        }

        AdminLogin user = getCurrentUser(jwt);

        // Admin can access any existing site.
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

    // Resolve PIN code only when the city has one unique PIN.
    private String resolvePincode(String city) {

        if (city == null || city.isBlank()) {
            return null;
        }

        List<String> pincodes = postalRepository
                .findExactCityMatches(city.trim())
                .stream()
                .map(IndiaPostalDirectory::getPincode)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(pin -> pin.matches("\\d{6}"))
                .distinct()
                .toList();

        return pincodes.size() == 1
                ? pincodes.get(0)
                : null;
    }

    // Create or update a Party using its site and desktop code.
    @Transactional
    public PartyMasterResponseDTO syncParty(
            Jwt jwt,
            PartyMasterRequestDTO request) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Party information is required"
            );
        }

        validateSiteAccess(jwt, request.siteId());

        if (request.partyCode() == null
                || request.partyCode().isBlank()
                || request.partyName() == null
                || request.partyName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Party code and Party name are required"
            );
        }

        String partyCode = request.partyCode().trim();

        Optional<PartyMaster> existing =
                partyRepository.findBySiteIdAndPartyCode(
                        request.siteId(),
                        partyCode
                );

        PartyMaster party = existing.orElseGet(PartyMaster::new);

        party.setSiteId(request.siteId());
        party.setPartyCode(partyCode);
        party.setPartyType(request.partyType());
        party.setPartyName(request.partyName().trim());
        party.setAddressLine1(request.addressLine1());
        party.setAddressLine2(request.addressLine2());
        party.setCity(request.city());
        party.setMobileNo(request.mobileNo());
        party.setEmailId(request.emailId());
        party.setGstNo(request.gstNo());
        party.setCharges(request.charges());

        String pincode = request.pincode();

        if (pincode != null && !pincode.isBlank()) {
        pincode = pincode.trim();

        if (!pincode.matches("\\d{6}")) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "PIN Code must contain exactly 6 digits"
                );
        }
        } else {
        pincode = resolvePincode(request.city());
        }

        party.setPincode(pincode);

        return toResponse(partyRepository.save(party));
    }

    // List Parties belonging to an authorized site.
    @Transactional(readOnly = true)
    public List<PartyMasterResponseDTO> getParties(
            Jwt jwt,
            Long siteId) {

        validateSiteAccess(jwt, siteId);

        return partyRepository
                .findBySiteIdOrderByPartyNameAsc(siteId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Retrieve one Party within its authorized site.
    @Transactional(readOnly = true)
    public PartyMasterResponseDTO getPartyById(
            Jwt jwt,
            Long siteId,
            Long partyId) {

        validateSiteAccess(jwt, siteId);

        PartyMaster party = partyRepository
                .findByIdAndSiteId(partyId, siteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Party not found"
                ));

        return toResponse(party);
    }

    private PartyMasterResponseDTO toResponse(PartyMaster party) {

        return new PartyMasterResponseDTO(
                party.getId(),
                party.getSiteId(),
                party.getPartyCode(),
                party.getPartyType(),
                party.getPartyName(),
                party.getAddressLine1(),
                party.getAddressLine2(),
                party.getCity(),
                party.getPincode(),
                party.getMobileNo(),
                party.getEmailId(),
                party.getGstNo(),
                party.getCharges(),
                party.getCreatedAt(),
                party.getUpdatedAt()
        );
    }
}
