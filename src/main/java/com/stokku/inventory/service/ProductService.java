package com.stokku.inventory.service;

import com.stokku.inventory.model.Category;
import com.stokku.inventory.model.Product;
import com.stokku.inventory.repo.CategoryRepository;
import com.stokku.inventory.repo.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final StockService stockService;

    public ProductService(ProductRepository productRepo, CategoryRepository categoryRepo,
                          StockService stockService) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.stockService = stockService;
    }

    public record ProductView(Long id, String sku, String name, String category,
                              String unit, BigDecimal price, int stock, int minStock,
                              int available, String status) {}

    public record CreateProduct(String sku, String name, Long categoryId, String unit,
                                BigDecimal price, Integer stock, Integer minStock) {}

    private String status(Product p) {
        if (p.getStock() <= 0) return "HABIS";
        if (p.getStock() <= p.getMinStock()) return "MENIPIS";
        return "AMAN";
    }

    public ProductView toView(Product p) {
        return new ProductView(p.getId(), p.getSku(), p.getName(),
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getUnit(), p.getPrice(), p.getStock(), p.getMinStock(),
                stockService.available(p), status(p));
    }

    public List<ProductView> list(String search) {
        List<Product> products = (search == null || search.isBlank())
                ? productRepo.findAll()
                : productRepo.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(search, search);
        return products.stream().map(this::toView).toList();
    }

    public List<ProductView> lowStock() {
        return productRepo.findAll().stream()
                .filter(p -> p.getStock() <= p.getMinStock())
                .map(this::toView).toList();
    }

    public ProductView get(Long id) {
        return toView(find(id));
    }

    public Product find(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produk tidak ditemukan"));
    }

    public ProductView create(CreateProduct dto) {
        if (productRepo.existsBySku(dto.sku()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SKU sudah dipakai: " + dto.sku());
        Category cat = dto.categoryId() == null ? null :
                categoryRepo.findById(dto.categoryId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori tidak ditemukan"));
        Product p = Product.builder()
                .sku(dto.sku()).name(dto.name()).category(cat)
                .unit(dto.unit() == null ? "unit" : dto.unit())
                .price(dto.price() == null ? BigDecimal.ZERO : dto.price())
                .stock(dto.stock() == null ? 0 : dto.stock())
                .minStock(dto.minStock() == null ? 0 : dto.minStock())
                .build();
        return toView(productRepo.save(p));
    }

    public ProductView update(Long id, CreateProduct dto) {
        Product p = find(id);
        if (dto.name() != null) p.setName(dto.name());
        if (dto.unit() != null) p.setUnit(dto.unit());
        if (dto.price() != null) p.setPrice(dto.price());
        if (dto.minStock() != null) p.setMinStock(dto.minStock());
        if (dto.categoryId() != null) {
            Category cat = categoryRepo.findById(dto.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori tidak ditemukan"));
            p.setCategory(cat);
        }
        // Catatan: stok TIDAK diubah lewat sini. Gunakan endpoint penyesuaian/barang-masuk.
        return toView(productRepo.save(p));
    }
}
