package com.techcorp.compliance.repository;

import com.techcorp.compliance.entity.Framework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FrameworkRepository extends JpaRepository<Framework, String> {

    Optional<Framework> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT f FROM Framework f WHERE f.isActive = true ORDER BY f.code ASC")
    List<Framework> findAllActiveOrderByCode();

    Optional<Framework> findByName(String frameworkId);
}
