package com.stokku.inventory.service;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.ProductRepository;
import com.stokku.inventory.repo.RequestItemRepository;
import com.stokku.inventory.repo.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Logika inti stok: catat pergerakan & hitung ketersediaan. */
@Service
public class StockService {

    private final ProductRepository productRepo;
    private final StockMovementRepository movementRepo;
    private final RequestItemRepository requestItemRepo;

    public StockService(ProductRepository productRepo,
                        StockMovementRepository movementRepo,
                        RequestItemRepository requestItemRepo) {
        this.productRepo = productRepo;
        this.movementRepo = movementRepo;
        this.requestItemRepo = requestItemRepo;
    }

    /** Catat satu pergerakan dan perbarui stok fisik (cache) produk. */
    @Transactional
    public StockMovement record(Product product, MovementType type, int signedQty,
                                String reason, ItemRequest request, User user) {
        product.setStock(product.getStock() + signedQty);
        productRepo.save(product);

        StockMovement mv = StockMovement.builder()
                .product(product).type(type).quantity(signedQty)
                .reason(reason).request(request).user(user)
                .build();
        return movementRepo.save(mv);
    }

    /** Jumlah yang sudah dialokasikan untuk permintaan disetujui tapi belum diserahkan. */
    public int allocated(Long productId) {
        return requestItemRepo
                .findByProduct_IdAndRequest_Status(productId, RequestStatus.DISETUJUI)
                .stream().mapToInt(RequestItem::getApprovedQty).sum();
    }

    /** Stok yang benar-benar bisa dipakai = fisik - alokasi. */
    public int available(Product product) {
        return product.getStock() - allocated(product.getId());
    }
}
