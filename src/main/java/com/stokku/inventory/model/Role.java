package com.stokku.inventory.model;

/** Application roles. Stored as authority "ROLE_ADMIN" / "ROLE_STAFF". */
public enum Role {
    ADMIN,   // petugas gudang: kelola stok, approve, penyesuaian, laporan
    STAFF    // user biasa: ajukan permintaan, cek stok, lihat status sendiri
}
