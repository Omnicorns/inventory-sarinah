package com.stokku.inventory.controller;

import com.stokku.inventory.model.Division;
import com.stokku.inventory.model.Role;
import com.stokku.inventory.model.User;
import com.stokku.inventory.repo.DivisionRepository;
import com.stokku.inventory.repo.UserRepository;
import com.stokku.inventory.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;
    private final DivisionRepository divisionRepo;
    private final PasswordEncoder encoder;

    public UserController(UserRepository userRepo, DivisionRepository divisionRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.divisionRepo = divisionRepo;
        this.encoder = encoder;
    }

    public record CreateUser(String name, String email, String password, Role role, Long divisionId) {}
    public record ChangePassword(String oldPassword, String newPassword) {}

    /** Admin: daftar semua user. passwordHash tidak ikut (sudah @JsonIgnore). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> list() {
        return userRepo.findAll();
    }

    /** Admin: buat user baru (tidak ada self-register untuk aplikasi internal). */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User create(@RequestBody CreateUser dto) {
        if (dto.email() == null || dto.email().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email wajib diisi");
        if (userRepo.existsByEmail(dto.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email sudah terdaftar: " + dto.email());
        if (dto.password() == null || dto.password().length() < 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password minimal 8 karakter");

        Division division = null;
        if (dto.divisionId() != null) {
            division = divisionRepo.findById(dto.divisionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Divisi tidak ditemukan: " + dto.divisionId()));
        }
        return userRepo.save(User.builder()
                .name(dto.name())
                .email(dto.email())
                .passwordHash(encoder.encode(dto.password()))
                .role(dto.role() == null ? Role.STAFF : dto.role())
                .division(division)
                .build());
    }

    /** Semua user: ganti password sendiri. */
    @PatchMapping("/me/password")
    public void changePassword(@AuthenticationPrincipal AuthUser me, @RequestBody ChangePassword dto) {
        User user = userRepo.findById(me.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User tidak valid"));
        if (!encoder.matches(dto.oldPassword(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password lama salah");
        if (dto.newPassword() == null || dto.newPassword().length() < 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password baru minimal 8 karakter");
        user.setPasswordHash(encoder.encode(dto.newPassword()));
        userRepo.save(user);
    }
}
