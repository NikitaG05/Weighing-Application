package com.example.weighbridge.service;

import com.example.weighbridge.dto.WeighmentImageResponseDTO;
import com.example.weighbridge.model.WeighmentImage;
import com.example.weighbridge.model.WeighmentRecord;
import com.example.weighbridge.repository.WeighmentImageRepository;
import com.example.weighbridge.repository.WeighmentRecordRepository;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import com.example.weighbridge.util.WeighmentImageTypeValidator;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WeighmentImageService {

    private static final int MAX_IMAGE_SIZE = 10 * 1024 * 1024;



    private final WeighmentRecordRepository weighmentRepository;
    private final WeighmentImageRepository imageRepository;
    private final SupabaseStorageService storageService;

    public WeighmentImageService(
            WeighmentRecordRepository weighmentRepository,
            WeighmentImageRepository imageRepository,
            SupabaseStorageService storageService) {

        this.weighmentRepository = weighmentRepository;
        this.imageRepository = imageRepository;
        this.storageService = storageService;
    }

    public WeighmentImage uploadImage(
            Long authorizedSiteId,
            Integer transactionId,
            String imageType,
            MultipartFile file) {

        if (authorizedSiteId == null || authorizedSiteId <= 0
                || transactionId == null || transactionId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid transaction"
            );
        }

        if (!WeighmentImageTypeValidator.isValid(imageType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid image type"
            );
        }

        if (file == null || file.isEmpty()
                || file.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid image size"
            );
        }

        WeighmentRecord weighment = weighmentRepository
                .findBySiteIdAndSourceTransactionId(
                        authorizedSiteId, transactionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Weighment not found for authorized site"
                ));

        try {
            byte[] bytes = file.getBytes();

            String contentType = detectContentType(bytes);

            String checksum = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(bytes)
            );

            WeighmentImage image = imageRepository
                    .findByWeighmentIdAndImageType(
                            weighment.getId(), imageType)
                    .orElseGet(WeighmentImage::new);

            if (checksum.equals(image.getChecksum())) {
                return image;
            }

            String storageKey = storageService.uploadImage(
                    authorizedSiteId,
                    transactionId,
                    imageType,
                    bytes,
                    contentType,
                    checksum
            );

            image.setWeighment(weighment);
            image.setImageType(imageType);
            image.setStorageKey(storageKey);
            image.setContentType(contentType);
            image.setChecksum(checksum);

            return imageRepository.save(image);

        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to read uploaded image",
                    ex
            );
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(
                    "SHA-256 is unavailable", ex
            );
        }
    }

    private String detectContentType(byte[] bytes) {

        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        byte[] pngSignature = {
                (byte) 0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A
        };

        if (bytes.length >= pngSignature.length) {
            boolean png = true;

            for (int i = 0; i < pngSignature.length; i++) {
                if (bytes[i] != pngSignature[i]) {
                    png = false;
                    break;
                }
            }

            if (png) {
                return "image/png";
            }
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only JPEG and PNG images are supported"
        );
    }


    private WeighmentRecord requireVisibleWeighment(
            Long siteId,
            Integer transactionId) {

        if (siteId == null || siteId <= 0
                || transactionId == null || transactionId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid transaction"
            );
        }

        return weighmentRepository
                .findBySiteIdAndSourceTransactionId(
                        siteId, transactionId)
                .filter(record ->
                        !Boolean.TRUE.equals(record.getDeleted())
                        && !Boolean.TRUE.equals(record.getCloudHidden()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Weighment transaction not found"
                ));
    }

    public List<WeighmentImageResponseDTO> getImages(
            Long authorizedSiteId,
            Integer transactionId) {

        WeighmentRecord weighment = requireVisibleWeighment(
                authorizedSiteId, transactionId
        );

        return imageRepository
                .findByWeighmentId(weighment.getId())
                .stream()
                .map(image -> new WeighmentImageResponseDTO(
                        image.getId(),
                        image.getImageType(),
                        image.getContentType()
                ))
                .toList();
    }

    public record ImageDownload(
            byte[] bytes,
            String contentType) {
    }

    public ImageDownload getImage(
            Long authorizedSiteId,
            Integer transactionId,
            String imageType) {

        if (!WeighmentImageTypeValidator.isValid(imageType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid image type"
            );
        }

        WeighmentRecord weighment = requireVisibleWeighment(
                authorizedSiteId, transactionId
        );

        WeighmentImage image = imageRepository
                .findByWeighmentIdAndImageType(
                        weighment.getId(), imageType)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Image not found"
                ));

        String expectedPrefix =
                "sites/" + authorizedSiteId
                + "/transactions/" + transactionId
                + "/" + imageType + "/";

        if (image.getStorageKey() == null
                || !image.getStorageKey().startsWith(expectedPrefix)) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Invalid image storage reference"
            );
        }

        byte[] bytes = storageService.downloadImage(
                image.getStorageKey()
        );

        String contentType;

        try {
            contentType = detectContentType(bytes);
        } catch (ResponseStatusException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Invalid stored image"
            );
        }

        if (!contentType.equals(image.getContentType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stored image content type mismatch"
            );
        }

        return new ImageDownload(bytes, contentType);
    }

}
