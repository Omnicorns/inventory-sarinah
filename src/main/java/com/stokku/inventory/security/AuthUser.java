package com.stokku.inventory.security;

import com.stokku.inventory.model.Role;

/** Principal di SecurityContext setelah JWT diverifikasi. division = nama divisi (bisa null untuk admin). */
public record AuthUser(Long id, String email, Role role, String division) {
}
