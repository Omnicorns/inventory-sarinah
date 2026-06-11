package com.stokku.inventory.controller;

import com.stokku.inventory.security.AuthUser;
import com.stokku.inventory.service.AdjustmentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StockController {

    private final AdjustmentService adjustmentService;

    public StockController(AdjustmentService adjustmentService) {
        this.adjustmentService = adjustmentService;
    }

    /** Penyesuaian stok (opname / rusak / hilang / koreksi). */
    @PostMapping("/adjustments")
    @PreAuthorize("hasRole('ADMIN')")
    public AdjustmentService.MovementView adjust(@AuthenticationPrincipal AuthUser me,
                                                 @RequestBody AdjustmentService.AdjustRequest body) {
        return adjustmentService.adjust(me, body);
    }

    /** Barang masuk dari supplier. */
    @PostMapping("/stock/incoming")
    @PreAuthorize("hasRole('ADMIN')")
    public AdjustmentService.MovementView incoming(@AuthenticationPrincipal AuthUser me,
                                                   @RequestBody AdjustmentService.IncomingRequest body) {
        return adjustmentService.incoming(me, body);
    }

    /** 20 pergerakan stok terbaru. */
    @GetMapping("/movements")
    public List<AdjustmentService.MovementView> movements() {
        return adjustmentService.recent();
    }
}
