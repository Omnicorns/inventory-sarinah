package com.stokku.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Buku besar (ledger) semua pergerakan stok. quantity bertanda (+/-). */
@Entity
@Table(name = "stock_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MovementType type;

    /** Bertanda: positif untuk masuk, negatif untuk keluar. */
    @Column(nullable = false)
    private Integer quantity;

    private String reason;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private ItemRequest request;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
