package com.stokku.inventory.service;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.StockMovementRepository;
import com.stokku.inventory.repo.UserRepository;
import com.stokku.inventory.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/** Penyesuaian stok, barang masuk, dan pembacaan riwayat pergerakan. */
@Service
public class AdjustmentService {

    private final StockService stockService;
    private final ProductService productService;
    private final StockMovementRepository movementRepo;
    private final UserRepository userRepo;

    public AdjustmentService(StockService stockService, ProductService productService,
                             StockMovementRepository movementRepo, UserRepository userRepo) {
        this.stockService = stockService;
        this.productService = productService;
        this.movementRepo = movementRepo;
        this.userRepo = userRepo;
    }

    public enum AdjustType { TAMBAH, KURANGI, SET }

    public record AdjustRequest(Long productId, AdjustType type, Integer quantity,
                                String reason, String note) {}
    public record IncomingRequest(Long productId, Integer quantity, String note) {}

    public record MovementView(Long id, Long productId, String sku, String productName,
                               String type, int quantity, String reason,
                               String by, LocalDateTime createdAt) {}

    private User user(AuthUser me) {
        return userRepo.findById(me.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User tidak valid"));
    }

    @Transactional
    public MovementView adjust(AuthUser me, AdjustRequest dto) {
        if (dto.quantity() == null || dto.quantity() < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah tidak valid");
        Product p = productService.findAccessible(me, dto.productId());
        int delta = switch (dto.type()) {
            case TAMBAH -> dto.quantity();
            case KURANGI -> -dto.quantity();
            case SET -> dto.quantity() - p.getStock();
        };
        if (p.getStock() + delta < 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Stok tidak boleh menjadi negatif");
        String reason = dto.reason() != null ? dto.reason() : "Penyesuaian";
        if (dto.note() != null && !dto.note().isBlank()) reason += " - " + dto.note();
        return toView(stockService.record(p, MovementType.PENYESUAIAN, delta, reason, null, user(me)));
    }

    @Transactional
    public MovementView incoming(AuthUser me, IncomingRequest dto) {
        if (dto.quantity() == null || dto.quantity() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah harus > 0");
        Product p = productService.findAccessible(me, dto.productId());
        String reason = "Barang masuk" + (dto.note() != null && !dto.note().isBlank() ? " - " + dto.note() : "");
        return toView(stockService.record(p, MovementType.MASUK, dto.quantity(), reason, null, user(me)));
    }

    public List<MovementView> recent(AuthUser me) {
        return movementRepo.findTop20ByOrderByCreatedAtDesc().stream()
                .filter(m -> {
                    if (me.role() == Role.ADMIN && me.division() == null) return true;
                    Product p = m.getProduct();
                    return me.division() != null && p.getDivision() != null
                            && me.division().equalsIgnoreCase(p.getDivision().getName());
                })
                .map(this::toView).toList();
    }

    public List<MovementView> byProduct(Long productId) {
        return movementRepo.findByProductIdOrderByCreatedAtDesc(productId).stream().map(this::toView).toList();
    }

    private MovementView toView(StockMovement m) {
        return new MovementView(m.getId(), m.getProduct().getId(), m.getProduct().getSku(),
                m.getProduct().getName(), m.getType().name(), m.getQuantity(), m.getReason(),
                m.getUser() != null ? m.getUser().getName() : null, m.getCreatedAt());
    }
}
