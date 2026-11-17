
package com.example.weighbridge.controller;

import com.example.weighbridge.model.WeighmentRecord;
import com.example.weighbridge.repository.SiteRepository;
import com.example.weighbridge.repository.WeighmentRecordRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class LocalReportsController {

    private final WeighmentRecordRepository repository;
    private final SiteRepository siteRepository;

    public LocalReportsController(
            WeighmentRecordRepository repository,
            SiteRepository siteRepository) {
        this.repository = repository;
        this.siteRepository = siteRepository;
    }

    @GetMapping("/local")
    public ResponseEntity<List<WeighmentRecord>> getCloudReports(
            @RequestParam Long siteId) {

        List<WeighmentRecord> records =
                repository
                    .findBySiteIdAndCompletedTrueAndDeletedFalseOrderByTicketDateDesc(
                        siteId
                    );

        String siteName = siteRepository.findById(siteId)
                .map(site -> site.getSiteName())
                .orElse(null);

        records.forEach(record -> {
            if (record.getWbName() == null ||
                record.getWbName().isBlank()) {
                record.setWbName(siteName);
            }
        });

        return ResponseEntity.ok(records);
    }
}
