package com.stokku.inventory.controller;

import com.stokku.inventory.security.AuthUser;
import com.stokku.inventory.service.IssueSlipService;
import com.stokku.inventory.service.RequestService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;
    private final IssueSlipService issueSlipService;

    public RequestController(RequestService requestService, IssueSlipService issueSlipService) {
        this.requestService = requestService;
        this.issueSlipService = issueSlipService;
    }

    /** Staff/admin mengajukan permintaan. */
    @PostMapping
    public RequestService.RequestView create(@AuthenticationPrincipal AuthUser me,
                                             @RequestBody RequestService.CreateRequest body) {
        return requestService.create(me, body);
    }

    /** Admin lihat semua, staff lihat miliknya sendiri. */
    @GetMapping
    public List<RequestService.RequestView> list(@AuthenticationPrincipal AuthUser me) {
        return requestService.list(me);
    }

    @GetMapping("/{id}")
    public RequestService.RequestView get(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return requestService.get(me, id);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public RequestService.RequestView approve(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                             @RequestBody(required = false) RequestService.ApproveRequest body) {
        return requestService.approve(me, id, body);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public RequestService.RequestView reject(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                            @RequestBody(required = false) RequestService.RejectRequest body) {
        return requestService.reject(me, id, body);
    }

    /** Serah-terima: stok fisik berkurang + struk terbit. */
    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasRole('ADMIN')")
    public IssueSlipService.SlipView deliver(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return requestService.deliver(me, id, issueSlipService);
    }

    @GetMapping("/{id}/slip")
    public IssueSlipService.SlipView slip(@PathVariable Long id) {
        return issueSlipService.getByRequest(id);
    }
}
