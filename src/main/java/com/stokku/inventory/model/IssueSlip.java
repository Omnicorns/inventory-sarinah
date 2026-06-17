package com.stokku.inventory.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Struk pengeluaran barang (BPB-xxxx) yang terbit saat barang diserahkan. */
@Entity
@Table(name = "issue_slips")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IssueSlip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;            // BPB-0001

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id")
    private ItemRequest request;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "issued_by")
    private User issuedBy;

    private String receivedBy;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    @OneToMany(mappedBy = "slip", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IssueSlipItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        this.issuedAt = LocalDateTime.now();
    }

    public void addItem(IssueSlipItem item) {
        item.setSlip(this);
        this.items.add(item);
    }
}
