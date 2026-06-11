package com.stokku.inventory.repo;

import com.stokku.inventory.model.MovementType;
import com.stokku.inventory.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<StockMovement> findTop20ByOrderByCreatedAtDesc();
    List<StockMovement> findByType(MovementType type);
    List<StockMovement> findByTypeAndCreatedAtBetween(MovementType type, LocalDateTime from, LocalDateTime to);
}
