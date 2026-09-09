package com.stokku.inventory.service;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.CategoryRepository;
import com.stokku.inventory.repo.DivisionRepository;
import com.stokku.inventory.repo.ProductRepository;
import com.stokku.inventory.repo.StockMovementRepository;
import com.stokku.inventory.security.AuthUser;
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
    private final DivisionRepository divisionRepo;
    private final StockService stockService;
    private final StockMovementRepository stockMovement;

    public ProductService(ProductRepository productRepo, CategoryRepository categoryRepo,
                          DivisionRepository divisionRepo, StockService stockService,
                          StockMovementRepository stockMovement) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.divisionRepo = divisionRepo;
        this.stockService = stockService;
        this.stockMovement = stockMovement;
    }

    public record ProductView(Long id, String sku, String name, String category,
                              Long divisionId, String division,
                              String unit, BigDecimal price, int stock, int minStock,
                              int available, String status, Boolean requestable) {}

    public record CreateProduct(String sku, String name, Long categoryId, Long divisionId,
                                String unit, BigDecimal price, Integer stock,
                                Integer minStock, Boolean requestable) {}

    private String status(Product p) {
        if (p.getStock() <= 0) return "HABIS";
        if (p.getStock() <= p.getMinStock()) return "MENIPIS";
        return "AMAN";
    }

    public ProductView toView(Product p) {
        return new ProductView(p.getId(), p.getSku(), p.getName(),
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getDivision() != null ? p.getDivision().getId() : null,
                p.getDivision() != null ? p.getDivision().getName() : null,
                p.getUnit(), p.getPrice(), p.getStock(), p.getMinStock(),
                stockService.available(p), status(p), Boolean.TRUE.equals(p.getRequestable()));
    }

    private Division divisionFrom(AuthUser me, Long requestedDivisionId) {
        // Admin pusat boleh menentukan divisi. Admin/user divisi selalu terkunci ke divisinya sendiri.
        if (me.division() != null) {
            Division own = divisionRepo.findByNameIgnoreCase(me.division())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Master divisi user tidak ditemukan: " + me.division()));
            if (requestedDivisionId != null && !own.getId().equals(requestedDivisionId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Tidak boleh membuat barang untuk divisi lain");
            }
            return own;
        }
        if (requestedDivisionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "divisionId wajib diisi untuk admin pusat");
        }
        return divisionRepo.findById(requestedDivisionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Divisi tidak ditemukan: " + requestedDivisionId));
    }

    private boolean canAccess(AuthUser me, Product p) {
        if (me.role() == Role.ADMIN && me.division() == null) return true;
        return me.division() != null && p.getDivision() != null
                && me.division().equalsIgnoreCase(p.getDivision().getName());
    }

    public List<ProductView> list(AuthUser me, String search) {
        List<Product> products;
        if (me.role() == Role.ADMIN && me.division() == null) {
            products = (search == null || search.isBlank())
                    ? productRepo.findAll()
                    : productRepo.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(search.trim(), search.trim());
        } else {
            Division d = divisionRepo.findByNameIgnoreCase(me.division())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Divisi user tidak ditemukan"));
            products = (search == null || search.isBlank())
                    ? productRepo.findAllByDivision_Id(d.getId())
                    : productRepo.findByDivision_IdAndNameContainingIgnoreCaseOrDivision_IdAndSkuContainingIgnoreCase(
                            d.getId(), search.trim(), d.getId(), search.trim());
        }
        return products.stream().map(this::toView).toList();
    }

    public List<ProductView> listRequestable(AuthUser me, String search) {
        List<Product> products;
        if (me.role() == Role.ADMIN && me.division() == null) {
            products = (search == null || search.isBlank())
                    ? productRepo.findAllByRequestableTrue()
                    : productRepo.findByRequestableTrueAndNameContainingIgnoreCaseOrRequestableTrueAndSkuContainingIgnoreCase(
                            search.trim(), search.trim());
        } else {
            Division d = divisionRepo.findByNameIgnoreCase(me.division())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Divisi user tidak ditemukan"));
            products = (search == null || search.isBlank())
                    ? productRepo.findAllByDivision_IdAndRequestableTrue(d.getId())
                    : productRepo.findByDivision_IdAndRequestableTrueAndNameContainingIgnoreCaseOrDivision_IdAndRequestableTrueAndSkuContainingIgnoreCase(
                            d.getId(), search.trim(), d.getId(), search.trim());
        }
        return products.stream().map(this::toView).toList();
    }

    public List<ProductView> lowStock(AuthUser me) {
        return list(me, null).stream()
                .filter(p -> p.stock() <= p.minStock())
                .toList();
    }

    public ProductView get(AuthUser me, Long id) {
        return toView(findAccessible(me, id));
    }

    public Product find(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produk tidak ditemukan"));
    }

    public Product findAccessible(AuthUser me, Long id) {
        Product p = find(id);
        if (!canAccess(me, p)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Produk bukan milik divisi Anda");
        }
        return p;
    }

    @Transactional
    public ProductView create(AuthUser me, CreateProduct dto) {
        Division division = divisionFrom(me, dto.divisionId());
        if (productRepo.existsBySkuAndDivision_Id(dto.sku(), division.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SKU sudah dipakai pada divisi " + division.getName() + ": " + dto.sku());
        }

        Category category = dto.categoryId() == null ? null : categoryRepo.findById(dto.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori tidak ditemukan"));

        int initialStock = dto.stock() == null ? 0 : dto.stock();
        if (initialStock < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stok awal tidak boleh kurang dari 0");
        }

        Product product = Product.builder()
                .sku(dto.sku()).name(dto.name()).category(category).division(division)
                .unit(dto.unit() == null ? "unit" : dto.unit())
                .price(dto.price() == null ? BigDecimal.ZERO : dto.price())
                .stock(initialStock).minStock(dto.minStock() == null ? 0 : dto.minStock())
                .requestable(dto.requestable() == null ? true : dto.requestable())
                .build();

        Product savedProduct = productRepo.save(product);
        if (initialStock > 0) {
            stockMovement.save(StockMovement.builder()
                    .product(savedProduct).quantity(initialStock).type(MovementType.MASUK)
                    .reason("Stok awal produk - " + division.getName())
                    .createdAt(LocalDateTime.now()).build());
        }
        return toView(savedProduct);
    }

    public ProductView update(AuthUser me, Long id, CreateProduct dto) {
        Product p = findAccessible(me, id);
        if (dto.name() != null) p.setName(dto.name());
        if (dto.unit() != null) p.setUnit(dto.unit());
        if (dto.price() != null) p.setPrice(dto.price());
        if (dto.minStock() != null) p.setMinStock(dto.minStock());
        if (dto.requestable() != null) p.setRequestable(dto.requestable());
        if (dto.categoryId() != null) {
            Category cat = categoryRepo.findById(dto.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kategori tidak ditemukan"));
            p.setCategory(cat);
        }
        return toView(productRepo.save(p));
    }
}
