package com.stokku.inventory.controller;

import com.stokku.inventory.service.ReportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public ReportService.Summary summary() {
        return reportService.summary();
    }

    @GetMapping("/outgoing-monthly")
    public List<ReportService.MonthPoint> outgoingMonthly() {
        return reportService.outgoingMonthly();
    }

    @GetMapping("/top-products")
    public List<ReportService.TopProduct> topProducts(@RequestParam(defaultValue = "5") int limit) {
        return reportService.topProducts(limit);
    }

    @GetMapping("/by-division")
    public List<ReportService.DivisionUsage> byDivision() {
        return reportService.byDivision();
    }

    /** Kartu stok per produk: saldo awal, masuk/keluar per transaksi, saldo berjalan. */
    @GetMapping("/stock-card")
    public ReportService.StockCard stockCard(
            @RequestParam Long productId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to) {
        return reportService.stockCard(productId, from, to);
    }
}
