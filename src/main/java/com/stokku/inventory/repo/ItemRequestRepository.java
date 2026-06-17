package com.stokku.inventory.repo;

import com.stokku.inventory.model.ItemRequest;
import com.stokku.inventory.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRequestRepository extends JpaRepository<ItemRequest, Long> {
    List<ItemRequest> findAllByOrderByCreatedAtDesc();
    List<ItemRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    List<ItemRequest> findByDivisionIgnoreCaseOrderByCreatedAtDesc(String division);
    long countByStatus(RequestStatus status);
}
