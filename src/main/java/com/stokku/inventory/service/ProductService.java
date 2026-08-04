package com.stokku.inventory.service;

import com.stokku.inventory.model.Category;
import com.stokku.inventory.model.MovementType;
import com.stokku.inventory.model.Product;
import com.stokku.inventory.model.StockMovement;
import com.stokku.inventory.repo.CategoryRepository;
import com.stokku.inventory.repo.ProductRepository;
import com.stokku.inventory.repo.StockMovementRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final StockService stockService;
    private final StockMovementRepository stockMovement;

    public ProductService(ProductRepository productRepo, CategoryRepository categoryRepo,
                          StockService stockService, StockMovementRepository stockMovement) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.stockService = stockService;
        this.stockMovement = stockMovement;
    }

    public record ProductView(Long id, String sku, String name, String category,
                              String unit, BigDecimal price, int stock, int minStock,
                              int available, String status) {}

    public record CreateProduct(String sku, String name, Long categoryId, String unit,
                                BigDecimal price, Integer stock, Integer minStock,Boolean requestable) {}

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

    @Transactional
    public ProductView create(CreateProduct dto) {
        if (productRepo.existsBySku(dto.sku())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "SKU sudah dipakai: " + dto.sku()
            );
        }

        Category category = dto.categoryId() == null
                ? null
                : categoryRepo.findById(dto.categoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Kategori tidak ditemukan"
                ));

        int initialStock = dto.stock() == null ? 0 : dto.stock();

        if (initialStock < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stok awal tidak boleh kurang dari 0"
            );
        }

        Product product = Product.builder()
                .sku(dto.sku())
                .name(dto.name())
                .category(category)
                .unit(dto.unit() == null ? "unit" : dto.unit())
                .price(dto.price() == null ? BigDecimal.ZERO : dto.price())
                .stock(initialStock)
                .minStock(dto.minStock() == null ? 0 : dto.minStock())
                .requestable(dto.requestable())
                .build();

        Product savedProduct = productRepo.save(product);

        // Catat stok awal ke kartu stok
        if (initialStock > 0) {
            StockMovement movement = StockMovement.builder()
                    .product(savedProduct)
                    .quantity(initialStock)
                    .type(MovementType.MASUK)
                    .reason("Stok awal produk")
                    .createdAt(LocalDateTime.now())
                    .build();

            stockMovement.save(movement);
        }

        return toView(savedProduct);
    }

    public ProductView update(Long id, CreateProduct dto) {
        Product p = find(id);
        if (dto.name() != null) p.setName(dto.name());
        if (dto.unit() != null) p.setUnit(dto.unit());
        if (dto.price() != null) p.setPrice(dto.price());
        if (dto.minStock() != null) p.setMinStock(dto.minStock());
        if (dto.requestable !=null) p.setRequestable(dto.requestable);
        if (dto.categoryId() != null) {
            Category cat = categoryRepo.findById(dto.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori tidak ditemukan"));
            p.setCategory(cat);
        }
        // Catatan: stok TIDAK diubah lewat sini. Gunakan endpoint penyesuaian/barang-masuk.
        return toView(productRepo.save(p));
    }
}
