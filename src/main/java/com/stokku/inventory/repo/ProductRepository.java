package com.stokku.inventory.repo;

import com.stokku.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);

    Optional<Product> findBySkuAndDivision_Id(String sku, Long divisionId);
    boolean existsBySkuAndDivision_Id(String sku, Long divisionId);

    List<Product> findAllByDivision_Id(Long divisionId);
    List<Product> findByDivision_IdAndNameContainingIgnoreCaseOrDivision_IdAndSkuContainingIgnoreCase(
            Long divisionId1, String name, Long divisionId2, String sku);

    List<Product> findAllByRequestableFalse();
    List<Product> findAllByRequestableTrue();
    List<Product> findAllByDivision_IdAndRequestableTrue(Long divisionId);

    List<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);

    List<Product> findByRequestableTrueAndNameContainingIgnoreCaseOrRequestableTrueAndSkuContainingIgnoreCase(
            String name, String sku);

    List<Product> findByDivision_IdAndRequestableTrueAndNameContainingIgnoreCaseOrDivision_IdAndRequestableTrueAndSkuContainingIgnoreCase(
            Long divisionId1, String name, Long divisionId2, String sku);
}
