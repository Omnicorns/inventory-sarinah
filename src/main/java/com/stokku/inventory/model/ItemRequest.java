package com.stokku.inventory.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Header permintaan barang (REQ-xxxx). Detail barang ada di RequestItem. */
@Entity
@Table(name = "item_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;            // REQ-0001

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "requester_id")
    private User requester;

    private String division;

    @Column(length = 1000)
    private String purpose;

    private LocalDate neededDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.MENUNGGU;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(length = 500)
    private String rejectReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

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
