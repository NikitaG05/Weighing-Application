package com.example.weighbridge.service;

import com.example.weighbridge.dto.WeighbridgeStatusResponseDTO;
import com.example.weighbridge.model.*;
import com.example.weighbridge.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class UserWeighbridgeStatusService {

    private final LoginRepository loginRepository;
    private final SiteRepository siteRepository;
    private final WeighBridgeRepository weighbridgeRepository;
    private final DesktopSyncClientRepository clientRepository;
    private final WeighmentRecordRepository recordRepository;

    public UserWeighbridgeStatusService(
            LoginRepository loginRepository,
            SiteRepository siteRepository,
            WeighBridgeRepository weighbridgeRepository,
            DesktopSyncClientRepository clientRepository,
            WeighmentRecordRepository recordRepository) {

        this.loginRepository = loginRepository;
        this.siteRepository = siteRepository;
        this.weighbridgeRepository = weighbridgeRepository;
        this.clientRepository = clientRepository;
        this.recordRepository = recordRepository;
    }

    @Transactional(readOnly = true)
    public List<WeighbridgeStatusResponseDTO> getStatus(
            String username) {

        AdminLogin user = loginRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "User not found"));

        if (!user.isEnabled() || !"USER".equals(user.getRole())
                || user.getAdminId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Access denied");
        }

        List<WeighbridgeStatusResponseDTO> result =
                new ArrayList<>();

        for (SiteMaster site :
                siteRepository.findByUserId(user.getAdminId())) {

            var bridges =
                    weighbridgeRepository.findBySite_Id(site.getId());

            var clients =
                    clientRepository.findBySiteId(site.getId());

            var records = recordRepository
                    .findBySiteIdAndDeletedFalseAndCloudHiddenFalseOrderByTicketDateDesc(
                            site.getId());

            for (WeighBridge bridge : bridges) {

                String status = bridges.size() != 1
                        ? "UNKNOWN"
                        : clients.stream().anyMatch(
                                DesktopSyncClient::isEnabled)
                                ? "ACTIVE" : "INACTIVE";

                var matchedRecords = bridges.size() == 1 ? records : records.stream()
                        .filter(r -> r.getWbName() != null
                                && r.getWbName().trim()
                                .equalsIgnoreCase(
                                    bridge.getWeighbridgeName().trim()))
                        .toList();

                Long totalTrips = matchedRecords.stream()
                        .filter(r -> Boolean.TRUE.equals(
                                r.getCompleted()))
                        .count();

                LocalDateTime lastUpdated = matchedRecords.stream()
                        .map(WeighmentRecord::getSyncedAt)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);

                result.add(new WeighbridgeStatusResponseDTO(
                        bridge.getId(),
                        bridge.getWeighbridgeName(),
                        site.getId(),
                        site.getSiteName(),
                        status,
                        "UNKNOWN",
                        null,
                        null,
                        null,
                        totalTrips,
                        null,
                        null,
                        lastUpdated
                ));
            }
        }

        return result;
    }
}
