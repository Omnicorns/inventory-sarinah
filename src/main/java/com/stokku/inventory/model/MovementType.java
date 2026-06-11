package com.stokku.inventory.model;

/** Jenis pergerakan stok pada buku besar (ledger). */
public enum MovementType {
    MASUK,        // barang masuk dari supplier (+)
    KELUAR,       // barang keluar (serah-terima permintaan) (-)
    PENYESUAIAN   // koreksi stok / opname (+ / -)
}
