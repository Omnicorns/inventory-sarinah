package com.stokku.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/** Baris barang dalam satu permintaan. */
@Entity
@Table(name = "request_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id")
    private ItemRequest request;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private Integer requestedQty;

    @Column(nullable = false)
    @Builder.Default
    private Integer approvedQty = 0;
}
