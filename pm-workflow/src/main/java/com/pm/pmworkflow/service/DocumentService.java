package com.pm.pmworkflow.service;

import com.pm.pmworkflow.domain.entity.Document;
import com.pm.pmworkflow.domain.repository.DocumentRepository;
import com.pm.pmworkflow.dto.request.DocumentRegisterRequest;
import com.pm.pmworkflow.dto.response.DocumentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DiscoveryClient discoveryClient;

    @Transactional
    public DocumentResponse register(DocumentRegisterRequest request) {
        Document document = Document.builder()
                .userId(request.getUserId())
                .projectId(request.getProjectId())
                .filename(request.getFilename())
                .originalFilename(request.getOriginalFilename())
                .fileType(request.getFileType())
                .fileSize(request.getFileSize())
                .storagePath(request.getStoragePath())
                .build();

        Document saved = documentRepository.save(document);
        return DocumentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByProject(Long projectId) {
        return documentRepository.findByProjectIdAndActStOrderByCreatedAtDesc(projectId, "ACTIVATE")
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByUser(Long userId) {
        return documentRepository.findByUserIdAndActStOrderByCreatedAtDesc(userId, "ACTIVATE")
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(Long id, Long userId) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));

        if (!document.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied to document: " + id);
        }

        return DocumentResponse.from(document);
    }

    @Transactional
    public void deleteDocument(Long id, Long userId) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));

        if (!document.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied to document: " + id);
        }

        document.delete();

        // pm-resource project_document 소프트 딜리트 (실패해도 삭제 자체는 성공)
        try {
            List<ServiceInstance> instances = discoveryClient.getInstances("PM-RESOURCE");
            if (!instances.isEmpty()) {
                String baseUrl = instances.getFirst().getUri().toString();
                RestClient.create(baseUrl)
                        .delete()
                        .uri("/api/project-document/internal/{documentId}", id)
                        .retrieve()
                        .toBodilessEntity();
                log.info("ProjectDocument soft-deleted: documentId={}", id);
            } else {
                log.warn("PM-RESOURCE service not found in Eureka");
            }
        } catch (Exception e) {
            log.warn("Failed to soft-delete project_document (non-fatal): documentId={}, error={}", id, e.getMessage());
        }
    }
}
