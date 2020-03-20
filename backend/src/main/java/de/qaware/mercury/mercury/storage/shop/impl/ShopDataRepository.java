package de.qaware.mercury.mercury.storage.shop.impl;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ShopDataRepository extends JpaRepository<ShopEntity, UUID> {
}
