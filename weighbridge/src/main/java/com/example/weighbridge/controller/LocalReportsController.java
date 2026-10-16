package com.example.weighbridge.controller;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/admin/reports")
public class LocalReportsController {

    private final Path exportDirectory;
    private final JsonMapper mapper = JsonMapper.builder().build();

    public LocalReportsController(
            @Value("${app.reports.export-directory}") String directory) {
        this.exportDirectory = Path.of(directory);
    }

    public record ReportsResponse(
        List<JsonNode> records,
        List<String> errors
    ) {}

    @GetMapping("/local")
    public ReportsResponse readReports() {
        if (!Files.isDirectory(exportDirectory)) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Export folder is unavailable"
            );
        }

        List<Path> files;

        // Reads D:/API/<date>/JSON/*.json
        try (Stream<Path> paths = Files.walk(exportDirectory, 3)) {
            files = paths
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString()
                    .toLowerCase(java.util.Locale.ROOT)
                    .endsWith(".json"))
                .filter(path -> path.getParent() != null
                    && "JSON".equalsIgnoreCase(
                        path.getParent().getFileName().toString()
                    ))
                .sorted(Comparator.comparing(Path::toString))
                .toList();
        } catch (Exception exception) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Cannot read the export folder"
            );
        }

        List<JsonNode> records = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Path file : files) {
            try {
                String content = Files.readString(
                    file, StandardCharsets.UTF_8
                );

                if (content.startsWith("\uFEFF")) {
                    content = content.substring(1);
                }

                JsonNode json = mapper.readTree(content);
                List<JsonNode> fileRecords = new ArrayList<>();

                if (json != null && json.isArray()) {
                    for (JsonNode item : json) {
                        validateRecord(item);
                        fileRecords.add(item);
                    }
                } else {
                    validateRecord(json);
                    fileRecords.add(json);
                }

                records.addAll(fileRecords);
            } catch (Exception exception) {
                errors.add(
                    exportDirectory.relativize(file)
                        + ": could not read a valid weighment JSON record"
                );
            }
        }

        return new ReportsResponse(records, errors);
    }

    private void validateRecord(JsonNode record) {
        if (record == null || !record.isObject()
                || !record.hasNonNull("TicketNo")) {
            throw new IllegalArgumentException(
                "Invalid weighment record"
            );
        }
    }
}