package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.AgentDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentDocumentRepository extends JpaRepository<AgentDocument, Long> {
    List<AgentDocument> findByAgentId(Long agentId);
    void deleteByAgentIdAndDocumentId(Long agentId, Long documentId);
}
