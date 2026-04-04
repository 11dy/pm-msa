package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserIdAndActStOrderByCreatedAtDesc(Long userId, String actSt);
    List<Document> findByProjectIdAndActStOrderByCreatedAtDesc(Long projectId, String actSt);
    int countByProjectIdAndActSt(Long projectId, String actSt);
}
