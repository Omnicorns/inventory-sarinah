package com.stokku.inventory.controller;

import com.stokku.inventory.service.AdjustmentService;
import com.stokku.inventory.service.ProductService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final AdjustmentService adjustmentService;

    public ProductController(ProductService productService, AdjustmentService adjustmentService) {
        this.productService = productService;
        this.adjustmentService = adjustmentService;
    }

    @GetMapping
    public List<ProductService.ProductView> list(@RequestParam(required = false) String search) {
        return productService.list(search);
    }

    @GetMapping("/requestable")
    public List<ProductService.ProductView> listRequestable(
            @RequestParam(required = false) String search
    ) {
        // Dipakai halaman user: hanya produk yang bisa diminta
        return productService.listRequestable(search);
    }

    @GetMapping("/low-stock")
    public List<ProductService.ProductView> lowStock() {
        return productService.lowStock();
    }

    @GetMapping("/{id}")
    public ProductService.ProductView get(@PathVariable Long id) {
        return productService.get(id);
    }

    @GetMapping("/{id}/movements")
    public List<AdjustmentService.MovementView> movements(@PathVariable Long id) {
        return adjustmentService.byProduct(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProductService.ProductView create(@RequestBody ProductService.CreateProduct body) {
        return productService.create(body);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductService.ProductView update(@PathVariable Long id, @RequestBody ProductService.CreateProduct body) {
        return productService.update(id, body);
    }
}
