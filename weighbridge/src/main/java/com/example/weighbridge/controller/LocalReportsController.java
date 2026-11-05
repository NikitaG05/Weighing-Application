
package com.example.weighbridge.controller;

import com.example.weighbridge.model.WeighmentRecord;
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

    public LocalReportsController(
            WeighmentRecordRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/weighments")
    public ResponseEntity<List<WeighmentRecord>> getCloudReports(
            @RequestParam Long siteId) {

        List<WeighmentRecord> records =
                repository
                    .findBySiteIdAndCompletedTrueAndDeletedFalseOrderByTicketDateDesc(
                        siteId
                    );

        return ResponseEntity.ok(records);
    }
}
