package com.stokku.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/** Salinan (snapshot) barang pada struk, agar tetap akurat walau produk berubah. */
@Entity
@Table(name = "issue_slip_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IssueSlipItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slip_id")
    private IssueSlip slip;

    private String sku;
    private String name;
    private Integer quantity;
    private String unit;
}
