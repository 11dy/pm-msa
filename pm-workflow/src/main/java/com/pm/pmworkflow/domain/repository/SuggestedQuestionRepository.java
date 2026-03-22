package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.SuggestedQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuggestedQuestionRepository extends JpaRepository<SuggestedQuestion, Long> {
    List<SuggestedQuestion> findByProjectIdAndUsedFalseOrderByCreatedAtDesc(Long projectId);
    List<SuggestedQuestion> findByDocumentIdAndUsedFalseOrderByCreatedAtDesc(Long documentId);
}
