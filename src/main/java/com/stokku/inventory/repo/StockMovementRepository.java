package com.stokku.inventory.repo;

import com.stokku.inventory.model.MovementType;
import com.stokku.inventory.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<StockMovement> findTop20ByOrderByCreatedAtDesc();
    List<StockMovement> findByType(MovementType type);
    List<StockMovement> findByTypeAndCreatedAtBetween(MovementType type, LocalDateTime from, LocalDateTime to);

    /** Baris kartu stok dalam periode, urut waktu. */
    List<StockMovement> findByProductIdAndCreatedAtBetweenOrderByCreatedAtAsc(
            Long productId, LocalDateTime from, LocalDateTime to);

    /** Saldo awal = total semua pergerakan sebelum periode. */
    @Query("SELECT COALESCE(SUM(m.quantity), 0) FROM StockMovement m " +
           "WHERE m.product.id = :productId AND m.createdAt < :before")
    int openingBalance(@Param("productId") Long productId, @Param("before") LocalDateTime before);
}
