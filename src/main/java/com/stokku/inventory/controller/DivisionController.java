package com.stokku.inventory.controller;

import com.stokku.inventory.model.Division;
import com.stokku.inventory.repo.DivisionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/divisions")
public class DivisionController {

    private final DivisionRepository divisionRepo;

    public DivisionController(DivisionRepository divisionRepo) {
        this.divisionRepo = divisionRepo;
    }

    /** Semua user boleh lihat daftar divisi (dipakai dropdown form). */
    @GetMapping
    public List<Division> list() {
        return divisionRepo.findAll();
    }

    /** Admin: tambah divisi baru. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Division create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nama divisi wajib diisi");
        if (divisionRepo.existsByNameIgnoreCase(name))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Divisi sudah ada: " + name);
        return divisionRepo.save(Division.builder().name(name.trim()).build());
    }
}
