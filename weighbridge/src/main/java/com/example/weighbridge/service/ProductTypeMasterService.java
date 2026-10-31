
package com.example.weighbridge.service;

import com.example.weighbridge.dto.ProductTypeMasterRequestDTO;
import com.example.weighbridge.dto.ProductTypeMasterResponseDTO;
import com.example.weighbridge.model.ProductTypeMaster;
import com.example.weighbridge.model.StatusMaster;
import com.example.weighbridge.repository.ProductTypeMasterRepository;
import com.example.weighbridge.repository.StatusRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ProductTypeMasterService {

    private static final Set<String> ALLOWED_STATUSES =
            Set.of("ACTIVE", "INACTIVE");

    private final ProductTypeMasterRepository productTypeRepository;
    private final StatusRepository statusRepository;

    public ProductTypeMasterService(
            ProductTypeMasterRepository productTypeRepository,
            StatusRepository statusRepository) {

        this.productTypeRepository = productTypeRepository;
        this.statusRepository = statusRepository;
    }

    // Retrieve all product types
    @Transactional(readOnly = true)
    public List<ProductTypeMasterResponseDTO> getAllProductTypes() {

        return productTypeRepository.findAllByOrderByTypeNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Retrieve only active product types
    @Transactional(readOnly = true)
    public List<ProductTypeMasterResponseDTO> getActiveProductTypes() {

        return productTypeRepository
                .findByStatus_StatusCodeOrderByTypeNameAsc("ACTIVE")
                .stream()
                .filter(type -> type.getStatus().isEnabled())
                .map(this::toResponse)
                .toList();
    }

    // Retrieve product type by ID
    @Transactional(readOnly = true)
    public ProductTypeMasterResponseDTO getProductTypeById(Long id) {

        return toResponse(findProductType(id));
    }

    // Create product type
    @Transactional
    public ProductTypeMasterResponseDTO createProductType(
            ProductTypeMasterRequestDTO request) {

        String code = normalizeCode(request.typeCode());
        String name = normalizeName(request.typeName());

        StatusMaster status = validateStatus(request.statusId());

        if (productTypeRepository.existsByTypeCode(code)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Product type code already exists: " + code
            );
        }

        ProductTypeMaster productType = new ProductTypeMaster();

        productType.setTypeCode(code);
        productType.setTypeName(name);
        productType.setStatus(status);

        ProductTypeMaster saved =
                productTypeRepository.saveAndFlush(productType);

        return toResponse(saved);
    }

    // Update product type
    @Transactional
    public ProductTypeMasterResponseDTO updateProductType(
            Long id,
            ProductTypeMasterRequestDTO request) {

        ProductTypeMaster productType = findProductType(id);

        String code = normalizeCode(request.typeCode());
        String name = normalizeName(request.typeName());

        StatusMaster status = validateStatus(request.statusId());

        if (productTypeRepository.existsByTypeCodeAndIdNot(code, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Product type code already exists: " + code
            );
        }

        productType.setTypeCode(code);
        productType.setTypeName(name);
        productType.setStatus(status);

        ProductTypeMaster updated =
                productTypeRepository.saveAndFlush(productType);

        return toResponse(updated);
    }

    // Delete product type
    @Transactional
    public void deleteProductType(Long id) {

        ProductTypeMaster productType = findProductType(id);

        try {
            productTypeRepository.delete(productType);
            productTypeRepository.flush();

        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Product type cannot be deleted because it is in use",
                    ex
            );
        }
    }

    // Find product type or return 404
    private ProductTypeMaster findProductType(Long id) {

        return productTypeRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Product type not found with ID: " + id
                        )
                );
    }

    // Validate status from existing Status Master
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

    // Normalize product type code
    private String normalizeCode(String code) {

        if (code == null || code.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product type code is required"
            );
        }

        String normalized = code.trim()
                .toUpperCase(Locale.ROOT);

        if (normalized.length() > 30) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product type code cannot exceed 30 characters"
            );
        }

        return normalized;
    }

    // Normalize product type name
    private String normalizeName(String name) {

        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product type name is required"
            );
        }

        String normalized = name.trim();

        if (normalized.length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Product type name cannot exceed 100 characters"
            );
        }

        return normalized;
    }

    // Convert entity to response DTO
    private ProductTypeMasterResponseDTO toResponse(
            ProductTypeMaster productType) {

        StatusMaster status = productType.getStatus();

        return new ProductTypeMasterResponseDTO(
                productType.getId(),
                productType.getTypeCode(),
                productType.getTypeName(),
                status.getId(),
                status.getStatusCode(),
                status.getStatusName()
        );
    }
}
