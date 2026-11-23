package com.example.weighbridge.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SupabaseStorageService {

    private final HttpClient httpClient;
    private final String supabaseUrl;
    private final String secretKey;
    private final String bucket;

    public SupabaseStorageService(
            @Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.secret-key:}") String secretKey,
            @Value("${app.supabase.bucket}") String bucket) {

        this.supabaseUrl = supabaseUrl.replaceAll("/+$", "");
        this.secretKey = secretKey;
        this.bucket = bucket;

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    public String uploadImage(
            Long siteId,
            Integer transactionId,
            String imageType,
            byte[] imageBytes,
            String contentType,
            String checksum) {

        if (supabaseUrl.isBlank() || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "Supabase Storage is not configured"
            );
        }

        if (siteId == null || siteId <= 0
                || transactionId == null || transactionId <= 0) {
            throw new IllegalArgumentException(
                    "Invalid site or transaction ID"
            );
        }

        if (!imageType.matches(
                "FirstWeightImage[12]|SecondWeightImage[12]")) {
            throw new IllegalArgumentException(
                    "Invalid image type"
            );
        }

        if (!"image/jpeg".equals(contentType)
                && !"image/png".equals(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported image content type"
            );
        }

        if (imageBytes == null || imageBytes.length == 0
                || imageBytes.length > 10 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Invalid image size"
            );
        }

        if (checksum == null
                || !checksum.matches("[a-fA-F0-9]{64}")) {
            throw new IllegalArgumentException(
                    "Invalid SHA-256 checksum"
            );
        }

        String extension = "image/png".equals(contentType)
                ? ".png" : ".jpg";

        String storageKey =
                "sites/" + siteId
                + "/transactions/" + transactionId
                + "/" + imageType
                + "/" + checksum.toLowerCase() + extension;

        String encodedPath = java.util.Arrays.stream(
                        (bucket + "/" + storageKey).split("/"))
                .map(part -> URLEncoder.encode(
                        part, StandardCharsets.UTF_8))
                .collect(java.util.stream.Collectors.joining("/"));

        URI uri = URI.create(
                supabaseUrl + "/storage/v1/object/" + encodedPath
        );

        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(90))
                .header("apikey", secretKey)
                .header("Authorization", "Bearer " + secretKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(imageBytes))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200
                    || response.statusCode() >= 300) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Supabase image upload failed: HTTP "
                                + response.statusCode()
                );
            }

            return storageKey;

        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Image upload interrupted",
                    ex
            );

        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to connect to Supabase Storage",
                    ex
            );
        }
    }
}
