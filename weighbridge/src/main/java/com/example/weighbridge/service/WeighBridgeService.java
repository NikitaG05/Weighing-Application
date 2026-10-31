
package com.example.weighbridge.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.weighbridge.dto.WeighBridgeRequestDTO;
import com.example.weighbridge.dto.WeighBridgeResponseDTO;
import com.example.weighbridge.model.AddressMaster;
import com.example.weighbridge.model.SiteMaster;
import com.example.weighbridge.model.WeighBridge;
import com.example.weighbridge.repository.AddressRepository;
import com.example.weighbridge.repository.SiteRepository;
import com.example.weighbridge.repository.WeighBridgeRepository;

@Service
public class WeighBridgeService {

    private final WeighBridgeRepository weighBridgeRepository;
    private final SiteRepository siteRepository;
    private final AddressRepository addressRepository;

    public WeighBridgeService(
            WeighBridgeRepository weighBridgeRepository,
            SiteRepository siteRepository,
            AddressRepository addressRepository) {

        this.weighBridgeRepository = weighBridgeRepository;
        this.siteRepository = siteRepository;
        this.addressRepository = addressRepository;
    }

    // Register new weighbridge
    @Transactional
    public WeighBridgeResponseDTO register(
            WeighBridgeRequestDTO request) {

        SiteMaster site = findSite(request.getSiteId());

        WeighBridge weighBridge = new WeighBridge();

        weighBridge.setWeighbridgeName(
                request.getWeighbridgeName().trim()
        );

        weighBridge.setSite(site);
        weighBridge.setTotalTrips(0L);

        WeighBridge saved =
                weighBridgeRepository.save(weighBridge);

        return toDTO(saved);
    }

    // Get all registered weighbridges
    @Transactional(readOnly = true)
    public List<WeighBridgeResponseDTO> getAll() {

        return weighBridgeRepository.findAll()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // Get weighbridge by ID
    @Transactional(readOnly = true)
    public WeighBridgeResponseDTO getById(Long id) {

        WeighBridge weighBridge = findWeighBridge(id);

        return toDTO(weighBridge);
    }

    // Update weighbridge
    @Transactional
    public WeighBridgeResponseDTO update(
            Long id,
            WeighBridgeRequestDTO request) {

        WeighBridge weighBridge = findWeighBridge(id);
        SiteMaster site = findSite(request.getSiteId());

        weighBridge.setWeighbridgeName(
                request.getWeighbridgeName().trim()
        );

        weighBridge.setSite(site);

        WeighBridge updated =
                weighBridgeRepository.save(weighBridge);

        return toDTO(updated);
    }

    // Delete weighbridge
    @Transactional
    public void delete(Long id) {

        WeighBridge weighBridge = findWeighBridge(id);

        weighBridgeRepository.delete(weighBridge);
    }

    // Find Site
    private SiteMaster findSite(Long siteId) {

        return siteRepository.findById(siteId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Site not found: " + siteId
                        )
                );
    }

    // Find Weighbridge
    private WeighBridge findWeighBridge(Long id) {

        return weighBridgeRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Weighbridge not found: " + id
                        )
                );
    }

    // Convert Entity to Response DTO
    private WeighBridgeResponseDTO toDTO(
            WeighBridge weighBridge) {

        SiteMaster site = weighBridge.getSite();

        String address = addressRepository
                .findById(site.getAddressId())
                .map(this::formatAddress)
                .orElse("");

        return new WeighBridgeResponseDTO(
                weighBridge.getId(),
                weighBridge.getWeighbridgeName(),
                site.getId(),
                site.getSiteName(),
                address,
                weighBridge.getTotalTrips()
        );
    }

    // Format address from Address Master
    private String formatAddress(AddressMaster address) {

        return String.join(", ",
                address.getCity(),
                address.getState(),
                address.getPincode()
        );
    }
}
