package com.pm.pmresource.domain.repository;

import com.pm.pmresource.domain.entity.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {

    int countByProjectIdAndActSt(Long projectId, String actSt);

    Optional<ProjectDocument> findByDocumentId(Long documentId);
}
