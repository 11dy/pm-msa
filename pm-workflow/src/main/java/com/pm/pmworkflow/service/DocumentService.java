package com.pm.pmworkflow.service;

import com.pm.pmworkflow.domain.entity.Document;
import com.pm.pmworkflow.domain.repository.DocumentRepository;
import com.pm.pmworkflow.dto.request.DocumentRegisterRequest;
import com.pm.pmworkflow.dto.response.DocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;

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
        return documentRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByUser(Long userId) {
        return documentRepository.findByUserIdOrderByCreatedAtDesc(userId)
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

        documentRepository.delete(document);
    }
}
