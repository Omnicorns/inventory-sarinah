package com.stokku.inventory.security;

import com.stokku.inventory.model.Role;

/** Principal yang disimpan di SecurityContext setelah JWT diverifikasi. */
public record AuthUser(Long id, String email, Role role) {
}
