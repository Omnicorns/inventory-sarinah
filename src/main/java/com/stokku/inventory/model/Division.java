package com.stokku.inventory.model;

import jakarta.persistence.*;
import lombok.*;

/** Master divisi (GA, Retail, Operasional, ...). Dikelola admin. */
@Entity
@Table(name = "divisions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Division {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
