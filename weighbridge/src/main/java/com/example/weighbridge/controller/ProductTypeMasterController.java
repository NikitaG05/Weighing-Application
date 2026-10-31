
package com.example.weighbridge.controller;

import com.example.weighbridge.dto.ProductTypeMasterRequestDTO;
import com.example.weighbridge.dto.ProductTypeMasterResponseDTO;
import com.example.weighbridge.service.ProductTypeMasterService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductTypeMasterController {

    private final ProductTypeMasterService productTypeMasterService;

    public ProductTypeMasterController(
            ProductTypeMasterService productTypeMasterService) {

        this.productTypeMasterService = productTypeMasterService;
    }

    // Get all product types - ADMIN and USER
    @GetMapping("/api/product-types")
    public ResponseEntity<List<ProductTypeMasterResponseDTO>>
            getAllProductTypes() {

        return ResponseEntity.ok(
                productTypeMasterService.getAllProductTypes()
        );
    }

    // Get active product types - ADMIN and USER
    @GetMapping("/api/product-types/active")
    public ResponseEntity<List<ProductTypeMasterResponseDTO>>
            getActiveProductTypes() {

        return ResponseEntity.ok(
                productTypeMasterService.getActiveProductTypes()
        );
    }

    // Get product type by ID - ADMIN and USER
    @GetMapping("/api/product-types/{id}")
    public ResponseEntity<ProductTypeMasterResponseDTO>
            getProductTypeById(@PathVariable Long id) {

        return ResponseEntity.ok(
                productTypeMasterService.getProductTypeById(id)
        );
    }

    // Create product type - ADMIN only
    @PostMapping("/api/admin/product-types")
    public ResponseEntity<ProductTypeMasterResponseDTO>
            createProductType(
                    @Valid @RequestBody
                    ProductTypeMasterRequestDTO request) {

        ProductTypeMasterResponseDTO response =
                productTypeMasterService.createProductType(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // Update product type - ADMIN only
    @PutMapping("/api/admin/product-types/{id}")
    public ResponseEntity<ProductTypeMasterResponseDTO>
            updateProductType(
                    @PathVariable Long id,
                    @Valid @RequestBody
                    ProductTypeMasterRequestDTO request) {

        return ResponseEntity.ok(
                productTypeMasterService.updateProductType(id, request)
        );
    }

    // Delete product type - ADMIN only
    @DeleteMapping("/api/admin/product-types/{id}")
    public ResponseEntity<Void>
            deleteProductType(@PathVariable Long id) {

        productTypeMasterService.deleteProductType(id);

        return ResponseEntity.noContent().build();
    }
}
