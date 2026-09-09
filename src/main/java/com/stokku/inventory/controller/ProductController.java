package com.stokku.inventory.controller;

import com.stokku.inventory.security.AuthUser;
import com.stokku.inventory.service.AdjustmentService;
import com.stokku.inventory.service.ProductService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public List<ProductService.ProductView> list(@AuthenticationPrincipal AuthUser me,
                                                 @RequestParam(required = false) String search) {
        return productService.list(me, search);
    }

    @GetMapping("/requestable")
    public List<ProductService.ProductView> listRequestable(@AuthenticationPrincipal AuthUser me,
                                                            @RequestParam(required = false) String search) {
        return productService.listRequestable(me, search);
    }

    @GetMapping("/low-stock")
    public List<ProductService.ProductView> lowStock(@AuthenticationPrincipal AuthUser me) {
        return productService.lowStock(me);
    }

    @GetMapping("/{id}")
    public ProductService.ProductView get(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return productService.get(me, id);
    }

    @GetMapping("/{id}/movements")
    public List<AdjustmentService.MovementView> movements(@AuthenticationPrincipal AuthUser me,
                                                          @PathVariable Long id) {
        productService.findAccessible(me, id);
        return adjustmentService.byProduct(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProductService.ProductView create(@AuthenticationPrincipal AuthUser me,
                                             @RequestBody ProductService.CreateProduct body) {
        return productService.create(me, body);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductService.ProductView update(@AuthenticationPrincipal AuthUser me,
                                             @PathVariable Long id,
                                             @RequestBody ProductService.CreateProduct body) {
        return productService.update(me, id, body);
    }
}
