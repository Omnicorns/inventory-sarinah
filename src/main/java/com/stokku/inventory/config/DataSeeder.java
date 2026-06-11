package com.stokku.inventory.config;

import com.stokku.inventory.model.*;
import com.stokku.inventory.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Data awal saat aplikasi pertama jalan (hanya jika DB kosong). */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final CategoryRepository categoryRepo;
    private final ProductRepository productRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository userRepo, CategoryRepository categoryRepo,
                      ProductRepository productRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.categoryRepo = categoryRepo;
        this.productRepo = productRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (userRepo.count() > 0) return;

        userRepo.save(User.builder()
                .name("Admin Gudang").email("admin@stokku.test")
                .passwordHash(encoder.encode("password")).role(Role.ADMIN)
                .division("Gudang").build());
        userRepo.save(User.builder()
                .name("Budi Santoso").email("budi@stokku.test")
                .passwordHash(encoder.encode("password")).role(Role.STAFF)
                .division("Operasional").build());

        Category elektronik = categoryRepo.save(Category.builder().name("Elektronik").build());
        Category aksesoris = categoryRepo.save(Category.builder().name("Aksesoris").build());

        productRepo.save(Product.builder().sku("SKU-1001").name("Kabel HDMI 2m")
                .category(aksesoris).unit("unit").price(new BigDecimal("45000"))
                .stock(142).minStock(20).build());
        productRepo.save(Product.builder().sku("SKU-1042").name("Keyboard mekanik")
                .category(elektronik).unit("unit").price(new BigDecimal("420000"))
                .stock(8).minStock(10).build());
        productRepo.save(Product.builder().sku("SKU-1108").name("Mouse wireless")
                .category(elektronik).unit("unit").price(new BigDecimal("95000"))
                .stock(0).minStock(10).build());
        productRepo.save(Product.builder().sku("SKU-1205").name("Powerbank 10000mAh")
                .category(elektronik).unit("unit").price(new BigDecimal("185000"))
                .stock(76).minStock(15).build());
        productRepo.save(Product.builder().sku("SKU-1320").name("Adaptor USB-C")
                .category(aksesoris).unit("unit").price(new BigDecimal("65000"))
                .stock(5).minStock(10).build());

        System.out.println(">> Seed selesai. Login admin: admin@stokku.test / password, staff: budi@stokku.test / password");
    }
}
