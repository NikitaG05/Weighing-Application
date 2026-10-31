package com.example.weighbridge.service;

import com.example.weighbridge.dto.ProductMasterRequestDTO;
import com.example.weighbridge.dto.ProductMasterResponseDTO;
import com.example.weighbridge.model.*;
import com.example.weighbridge.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ProductMasterService {
    private static final Set<String> PRODUCT_STATUSES = Set.of("ACTIVE", "INACTIVE");
    private final ProductMasterRepository products;
    private final UnitMasterRepository units;
    private final ProductTypeMasterRepository types;
    private final StatusRepository statuses;

    public ProductMasterService(ProductMasterRepository products,
                                UnitMasterRepository units,
                                ProductTypeMasterRepository types,
                                StatusRepository statuses) {
        this.products = products;
        this.units = units;
        this.types = types;
        this.statuses = statuses;
    }

    @Transactional(readOnly = true)
    public List<ProductMasterResponseDTO> getAllProducts() {
        return products.findAllByOrderByProductNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductMasterResponseDTO> getActiveProducts() {
        return products.findByStatus_StatusCodeOrderByProductNameAsc("ACTIVE")
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductMasterResponseDTO getProductById(Long id) {
        return toResponse(findProduct(id));
    }

    @Transactional
    public ProductMasterResponseDTO createProduct(ProductMasterRequestDTO request) {
        String code = normalizeCode(request.productCode());
        if (products.existsByProductCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product code already exists: " + code);
        }
        ProductMaster product = new ProductMaster();
        applyRequest(product, request, code);
        try {
            return toResponse(products.saveAndFlush(product));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product could not be saved; check code and references", ex);
        }
    }

    @Transactional
    public ProductMasterResponseDTO updateProduct(Long id, ProductMasterRequestDTO request) {
        ProductMaster product = findProduct(id);
        String code = normalizeCode(request.productCode());
        if (products.existsByProductCodeAndIdNot(code, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product code already exists: " + code);
        }
        applyRequest(product, request, code);
        try {
            return toResponse(products.saveAndFlush(product));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product could not be updated", ex);
        }
    }

    @Transactional
    public void deleteProduct(Long id) {
        ProductMaster product = findProduct(id);
        try {
            products.delete(product);
            products.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Product is referenced by another record; set it INACTIVE instead", ex);
        }
    }

    private ProductMaster findProduct(Long id) {
        return products.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
    }

    private void applyRequest(ProductMaster product, ProductMasterRequestDTO request, String code) {
        UnitMaster unit = units.findById(request.unitId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid unitId"));
        ProductTypeMaster type = types.findById(request.productTypeId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid productTypeId"));
        StatusMaster status = statuses.findById(request.statusId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid statusId"));

        if (!"ACTIVE".equalsIgnoreCase(unit.getStatus().getStatusCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected unit is inactive");
        }
        if (!"ACTIVE".equalsIgnoreCase(type.getStatus().getStatusCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected product type is inactive");
        }
        if (!Boolean.TRUE.equals(status.isEnabled()) || !PRODUCT_STATUSES.contains(status.getStatusCode().toUpperCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be enabled ACTIVE or INACTIVE");
        }
        product.setProductCode(code);
        product.setProductName(request.productName().trim());
        product.setUnit(unit);
        product.setProductType(type);
        product.setRate(request.rate());
        product.setStatus(status);
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private ProductMasterResponseDTO toResponse(ProductMaster p) {
        return new ProductMasterResponseDTO(
            p.getId(), p.getProductCode(), p.getProductName(),
            p.getUnit().getId(), p.getUnit().getUnitCode(), p.getUnit().getUnitName(),
            p.getProductType().getId(), p.getProductType().getTypeCode(), p.getProductType().getTypeName(),
            p.getRate(), p.getStatus().getId(), p.getStatus().getStatusCode(), p.getStatus().getStatusName()
        );
    }
}
