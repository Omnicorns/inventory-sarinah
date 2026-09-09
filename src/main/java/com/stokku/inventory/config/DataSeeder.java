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
    private final DivisionRepository divisionRepo;
    private final CategoryRepository categoryRepo;
    private final ProductRepository productRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository userRepo, DivisionRepository divisionRepo,
                      CategoryRepository categoryRepo, ProductRepository productRepo,
                      PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.divisionRepo = divisionRepo;
        this.categoryRepo = categoryRepo;
        this.productRepo = productRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (userRepo.count() > 0) return;

        Division ga = divisionRepo.save(Division.builder().name("GA").build());
        Division retail = divisionRepo.save(Division.builder().name("Retail").build());
        Division ops = divisionRepo.save(Division.builder().name("Operasional").build());

        userRepo.save(User.builder()
                .name("Admin Gudang").email("admin@stokku.test")
                .passwordHash(encoder.encode("password")).role(Role.ADMIN)
                .division(null).build());
        userRepo.save(User.builder()
                .name("Budi Santoso").email("budi@stokku.test")
                .passwordHash(encoder.encode("password")).role(Role.STAFF)
                .division(ops).build());
        userRepo.save(User.builder()
                .name("Sari Dewi").email("sari@stokku.test")
                .passwordHash(encoder.encode("password")).role(Role.STAFF)
                .division(ga).build());
        userRepo.save(User.builder()
                .name("Rudi Hartono").email("rudi@stokku.test")
                .passwordHash(encoder.encode("password")).role(Role.STAFF)
                .division(retail).build());

        Category elektronik = categoryRepo.save(Category.builder().name("Elektronik").build());
        Category aksesoris = categoryRepo.save(Category.builder().name("Aksesoris").build());

        // POC: SKU yang sama dapat mempunyai stok berbeda di masing-masing divisi.
        productRepo.save(Product.builder().sku("SKU-1001").name("Kabel HDMI 2m")
                .category(aksesoris).division(ga).unit("unit").price(new BigDecimal("45000"))
                .stock(40).minStock(10).build());
        productRepo.save(Product.builder().sku("SKU-1001").name("Kabel HDMI 2m")
                .category(aksesoris).division(retail).unit("unit").price(new BigDecimal("45000"))
                .stock(15).minStock(5).build());
        productRepo.save(Product.builder().sku("SKU-1001").name("Kabel HDMI 2m")
                .category(aksesoris).division(ops).unit("unit").price(new BigDecimal("45000"))
                .stock(87).minStock(20).build());

        productRepo.save(Product.builder().sku("SKU-1042").name("Keyboard mekanik")
                .category(elektronik).division(ga).unit("unit").price(new BigDecimal("420000"))
                .stock(8).minStock(10).build());
        productRepo.save(Product.builder().sku("SKU-1108").name("Mouse wireless")
                .category(elektronik).division(retail).unit("unit").price(new BigDecimal("95000"))
                .stock(0).minStock(10).build());
        productRepo.save(Product.builder().sku("SKU-1205").name("Powerbank 10000mAh")
                .category(elektronik).division(ops).unit("unit").price(new BigDecimal("185000"))
                .stock(76).minStock(15).build());

        System.out.println(">> Seed POC division stock: admin pusat + GA/Retail/Operasional — password: password");
    }
}
