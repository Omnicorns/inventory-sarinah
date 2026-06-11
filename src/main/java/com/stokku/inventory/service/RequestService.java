package com.stokku.inventory.service;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.*;
import com.stokku.inventory.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RequestService {

    private final ItemRequestRepository requestRepo;
    private final RequestItemRepository itemRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final IssueSlipRepository slipRepo;
    private final StockService stockService;

    public RequestService(ItemRequestRepository requestRepo, RequestItemRepository itemRepo,
                          ProductRepository productRepo, UserRepository userRepo,
                          IssueSlipRepository slipRepo, StockService stockService) {
        this.requestRepo = requestRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
        this.slipRepo = slipRepo;
        this.stockService = stockService;
    }

    // ---- DTOs ----
    public record Line(Long productId, Integer qty) {}
    public record CreateRequest(String division, String purpose, LocalDate neededDate, List<Line> items) {}
    public record ApprovedLine(Long requestItemId, Integer approvedQty) {}
    public record ApproveRequest(List<ApprovedLine> items) {}
    public record RejectRequest(String reason) {}

    public record LineView(Long itemId, Long productId, String sku, String productName,
                           String unit, int requestedQty, int approvedQty) {}
    public record RequestView(Long id, String code, String requesterName, String division,
                              String purpose, LocalDate neededDate, String status,
                              String approvedBy, String rejectReason,
                              LocalDateTime createdAt, List<LineView> items) {}

    private User currentUser(AuthUser me) {
        return userRepo.findById(me.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User tidak valid"));
    }

    private RequestView toView(ItemRequest r) {
        List<LineView> lines = itemRepo.findByRequestId(r.getId()).stream()
                .map(i -> new LineView(i.getId(), i.getProduct().getId(), i.getProduct().getSku(),
                        i.getProduct().getName(), i.getProduct().getUnit(),
                        i.getRequestedQty(), i.getApprovedQty()))
                .toList();
        return new RequestView(r.getId(), r.getCode(),
                r.getRequester() != null ? r.getRequester().getName() : null,
                r.getDivision(), r.getPurpose(), r.getNeededDate(), r.getStatus().name(),
                r.getApprovedBy() != null ? r.getApprovedBy().getName() : null,
                r.getRejectReason(), r.getCreatedAt(), lines);
    }

    @Transactional
    public RequestView create(AuthUser me, CreateRequest dto) {
        if (dto.items() == null || dto.items().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimal satu barang");
        User requester = currentUser(me);

        ItemRequest req = ItemRequest.builder()
                .code("TMP")
                .requester(requester)
                .division(dto.division() != null ? dto.division() : requester.getDivision())
                .purpose(dto.purpose())
                .neededDate(dto.neededDate())
                .status(RequestStatus.MENUNGGU)
                .build();
        req = requestRepo.save(req);
        req.setCode(String.format("REQ-%04d", req.getId()));
        requestRepo.save(req);

        for (Line line : dto.items()) {
            if (line.qty() == null || line.qty() <= 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah harus > 0");
            Product p = productRepo.findById(line.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produk tidak ditemukan: " + line.productId()));
            itemRepo.save(RequestItem.builder()
                    .request(req).product(p).requestedQty(line.qty()).approvedQty(0).build());
        }
        return toView(req);
    }

    public List<RequestView> list(AuthUser me) {
        List<ItemRequest> rows = me.role() == Role.ADMIN
                ? requestRepo.findAllByOrderByCreatedAtDesc()
                : requestRepo.findByRequesterIdOrderByCreatedAtDesc(me.id());
        return rows.stream().map(this::toView).toList();
    }

    public RequestView get(AuthUser me, Long id) {
        ItemRequest r = requestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permintaan tidak ditemukan"));
        if (me.role() != Role.ADMIN && !r.getRequester().getId().equals(me.id()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bukan permintaan Anda");
        return toView(r);
    }

    @Transactional
    public RequestView approve(AuthUser me, Long id, ApproveRequest dto) {
        ItemRequest r = mustBe(id, RequestStatus.MENUNGGU);
        User admin = currentUser(me);

        Map<Long, Integer> approvals = (dto != null && dto.items() != null)
                ? dto.items().stream().collect(Collectors.toMap(ApprovedLine::requestItemId, ApprovedLine::approvedQty))
                : Map.of();

        for (RequestItem item : itemRepo.findByRequestId(id)) {
            int approved = approvals.getOrDefault(item.getId(), item.getRequestedQty());
            if (approved < 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah disetujui tidak boleh negatif");
            int available = stockService.available(item.getProduct());
            if (approved > available)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Stok tidak cukup untuk " + item.getProduct().getName()
                                + " (tersedia " + available + ", diminta " + approved + ")");
            item.setApprovedQty(approved);
            itemRepo.save(item);
        }
        r.setStatus(RequestStatus.DISETUJUI);
        r.setApprovedBy(admin);
        requestRepo.save(r);
        return toView(r);
    }

    @Transactional
    public RequestView reject(AuthUser me, Long id, RejectRequest dto) {
        ItemRequest r = mustBe(id, RequestStatus.MENUNGGU);
        r.setStatus(RequestStatus.DITOLAK);
        r.setApprovedBy(currentUser(me));
        r.setRejectReason(dto != null ? dto.reason() : null);
        requestRepo.save(r);
        return toView(r);
    }

    /** Serah-terima: stok fisik berkurang + struk terbit. */
    @Transactional
    public IssueSlipService.SlipView deliver(AuthUser me, Long id, IssueSlipService slipService) {
        ItemRequest r = mustBe(id, RequestStatus.DISETUJUI);
        User admin = currentUser(me);

        List<RequestItem> items = itemRepo.findByRequestId(id);
        for (RequestItem item : items) {
            if (item.getApprovedQty() <= 0) continue;
            if (item.getProduct().getStock() < item.getApprovedQty())
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Stok fisik kurang untuk " + item.getProduct().getName());
            stockService.record(item.getProduct(), MovementType.KELUAR,
                    -item.getApprovedQty(), "Permintaan " + r.getCode(), r, admin);
        }
        r.setStatus(RequestStatus.DISERAHKAN);
        requestRepo.save(r);
        return slipService.issue(r, items, admin);
    }

    private ItemRequest mustBe(Long id, RequestStatus expected) {
        ItemRequest r = requestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permintaan tidak ditemukan"));
        if (r.getStatus() != expected)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Status permintaan " + r.getStatus() + ", aksi tidak berlaku");
        return r;
    }
}
