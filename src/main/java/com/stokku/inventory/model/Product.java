package com.stokku.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "products",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_products_sku_division",
                columnNames = {"sku", "division_id"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** SKU boleh sama di divisi berbeda, tetapi harus unik di divisi yang sama. */
    @Column(nullable = false)
    private String sku;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    /** Pemilik stok/barang. Null hanya untuk data legacy sebelum POC. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "division_id")
    private Division division;

    @Column(nullable = false)
    private String unit;            // unit, box, pcs

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    /** Stok fisik berjalan untuk produk pada divisi ini. */
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    /** Ambang batas peringatan "menipis" untuk divisi ini. */
    @Column(nullable = false)
    @Builder.Default
    private Integer minStock = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean requestable = true;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
