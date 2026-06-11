package com.stokku.inventory.model;

/** Status siklus hidup sebuah permintaan barang. */
public enum RequestStatus {
    MENUNGGU,    // diajukan staff, menunggu admin
    DISETUJUI,   // di-approve, stok dialokasikan (belum keluar fisik)
    DITOLAK,     // ditolak admin
    DISERAHKAN   // barang diserahkan, stok fisik berkurang, struk terbit
}
