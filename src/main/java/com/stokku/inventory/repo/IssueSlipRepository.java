package com.stokku.inventory.repo;

import com.stokku.inventory.model.IssueSlip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IssueSlipRepository extends JpaRepository<IssueSlip, Long> {
    Optional<IssueSlip> findByRequestId(Long requestId);
    Optional<IssueSlip> findByCode(String code);
}
