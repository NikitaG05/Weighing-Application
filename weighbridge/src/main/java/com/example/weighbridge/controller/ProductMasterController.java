package com.example.weighbridge.controller;

import com.example.weighbridge.dto.ProductMasterRequestDTO;
import com.example.weighbridge.dto.ProductMasterResponseDTO;
import com.example.weighbridge.service.ProductMasterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class ProductMasterController {
    private final ProductMasterService service;

    public ProductMasterController(ProductMasterService service) { this.service = service; }

    @GetMapping("/api/products")
    public ResponseEntity<List<ProductMasterResponseDTO>> getAllProducts() {
        return ResponseEntity.ok(service.getAllProducts());
    }

    @GetMapping("/api/products/active")
    public ResponseEntity<List<ProductMasterResponseDTO>> getActiveProducts() {
        return ResponseEntity.ok(service.getActiveProducts());
    }

    @GetMapping("/api/products/{id}")
    public ResponseEntity<ProductMasterResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getProductById(id));
    }

    @PostMapping("/api/admin/products")
    public ResponseEntity<ProductMasterResponseDTO> createProduct(@Valid @RequestBody ProductMasterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createProduct(request));
    }

    @PutMapping("/api/admin/products/{id}")
    public ResponseEntity<ProductMasterResponseDTO> updateProduct(@PathVariable Long id,
        @Valid @RequestBody ProductMasterRequestDTO request) {
        return ResponseEntity.ok(service.updateProduct(id, request));
    }

    @DeleteMapping("/api/admin/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        service.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
