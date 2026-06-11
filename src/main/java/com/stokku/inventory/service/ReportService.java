package com.stokku.inventory.service;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Laporan dihitung di sisi aplikasi agar portabel lintas database. */
@Service
public class ReportService {

    private final ProductRepository productRepo;
    private final ItemRequestRepository requestRepo;
    private final RequestItemRepository itemRepo;
    private final StockMovementRepository movementRepo;

    public ReportService(ProductRepository productRepo, ItemRequestRepository requestRepo,
                         RequestItemRepository itemRepo, StockMovementRepository movementRepo) {
        this.productRepo = productRepo;
        this.requestRepo = requestRepo;
        this.itemRepo = itemRepo;
        this.movementRepo = movementRepo;
    }

    public record Summary(long totalProducts, BigDecimal stockValue, long lowStock,
                          long outOfStock, long pendingRequests, long outgoingToday) {}
    public record MonthPoint(String month, int total) {}
    public record TopProduct(String sku, String name, int total) {}
    public record DivisionUsage(String division, long requests, double percent) {}

    public Summary summary() {
        List<Product> products = productRepo.findAll();
        BigDecimal value = products.stream()
                .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long low = products.stream().filter(p -> p.getStock() > 0 && p.getStock() <= p.getMinStock()).count();
        long out = products.stream().filter(p -> p.getStock() <= 0).count();
        long pending = requestRepo.countByStatus(RequestStatus.MENUNGGU);

        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        int outToday = movementRepo.findByTypeAndCreatedAtBetween(MovementType.KELUAR, start, end)
                .stream().mapToInt(m -> Math.abs(m.getQuantity())).sum();

        return new Summary(products.size(), value, low, out, pending, outToday);
    }

    public List<MonthPoint> outgoingMonthly() {
        Map<YearMonth, Integer> byMonth = movementRepo.findByType(MovementType.KELUAR).stream()
                .collect(Collectors.groupingBy(
                        m -> YearMonth.from(m.getCreatedAt()),
                        Collectors.summingInt(m -> Math.abs(m.getQuantity()))));
        return byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new MonthPoint(e.getKey().toString(), e.getValue()))
                .toList();
    }

    public List<TopProduct> topProducts(int limit) {
        Map<Product, Integer> totals = itemRepo.findAll().stream()
                .collect(Collectors.groupingBy(RequestItem::getProduct,
                        Collectors.summingInt(RequestItem::getRequestedQty)));
        return totals.entrySet().stream()
                .sorted(Map.Entry.<Product, Integer>comparingByValue().reversed())
                .limit(limit)
                .map(e -> new TopProduct(e.getKey().getSku(), e.getKey().getName(), e.getValue()))
                .toList();
    }

    public List<DivisionUsage> byDivision() {
        List<ItemRequest> all = requestRepo.findAll();
        long total = all.size();
        Map<String, Long> counts = all.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getDivision() == null ? "Lainnya" : r.getDivision(),
                        Collectors.counting()));
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new DivisionUsage(e.getKey(), e.getValue(),
                        total == 0 ? 0 : Math.round(e.getValue() * 1000.0 / total) / 10.0))
                .toList();
    }
}
