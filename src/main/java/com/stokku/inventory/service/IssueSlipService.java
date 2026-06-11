package com.stokku.inventory.service;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.IssueSlipRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IssueSlipService {

    private final IssueSlipRepository slipRepo;

    public IssueSlipService(IssueSlipRepository slipRepo) {
        this.slipRepo = slipRepo;
    }

    public record SlipLine(String sku, String name, int quantity, String unit) {}
    public record SlipView(Long id, String code, String requestCode, String issuedBy,
                           String receivedBy, String note, LocalDateTime issuedAt,
                           List<SlipLine> items) {}

    @Transactional
    public SlipView issue(ItemRequest request, List<RequestItem> items, User admin) {
        IssueSlip slip = IssueSlip.builder()
                .code("TMP")
                .request(request)
                .issuedBy(admin)
                .receivedBy(request.getRequester() != null ? request.getRequester().getName() : null)
                .build();
        for (RequestItem it : items) {
            if (it.getApprovedQty() <= 0) continue;
            slip.addItem(IssueSlipItem.builder()
                    .sku(it.getProduct().getSku())
                    .name(it.getProduct().getName())
                    .quantity(it.getApprovedQty())
                    .unit(it.getProduct().getUnit())
                    .build());
        }
        slip = slipRepo.save(slip);
        slip.setCode(String.format("BPB-%04d", slip.getId()));
        slip = slipRepo.save(slip);
        return toView(slip);
    }

    public SlipView getByRequest(Long requestId) {
        return toView(slipRepo.findByRequestId(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Struk belum terbit")));
    }

    public SlipView get(Long id) {
        return toView(slipRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Struk tidak ditemukan")));
    }

    private SlipView toView(IssueSlip s) {
        List<SlipLine> lines = s.getItems().stream()
                .map(i -> new SlipLine(i.getSku(), i.getName(), i.getQuantity(), i.getUnit()))
                .toList();
        return new SlipView(s.getId(), s.getCode(),
                s.getRequest() != null ? s.getRequest().getCode() : null,
                s.getIssuedBy() != null ? s.getIssuedBy().getName() : null,
                s.getReceivedBy(), s.getNote(), s.getIssuedAt(), lines);
    }
}
