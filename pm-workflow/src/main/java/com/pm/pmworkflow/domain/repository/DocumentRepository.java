package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Document> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
