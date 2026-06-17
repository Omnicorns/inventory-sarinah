package com.stokku.inventory.repo;

import com.stokku.inventory.model.RequestItem;
import com.stokku.inventory.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestItemRepository extends JpaRepository<RequestItem, Long> {
    List<RequestItem> findByRequestId(Long requestId);
    List<RequestItem> findByProduct_IdAndRequest_Status(Long productId, RequestStatus status);
    List<RequestItem> findByRequest_Status(RequestStatus status);
}
