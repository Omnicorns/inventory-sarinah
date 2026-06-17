package com.stokku.inventory.repo;

import com.stokku.inventory.model.Division;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DivisionRepository extends JpaRepository<Division, Long> {
    Optional<Division> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
