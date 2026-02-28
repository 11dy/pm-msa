package com.pm.pmresource.service;

import com.pm.pmresource.domain.entity.ProjectDocument;
import com.pm.pmresource.domain.repository.ProjectDocumentRepository;
import com.pm.pmresource.dto.request.ProjectDocumentRegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectDocumentService {

    private final ProjectDocumentRepository projectDocumentRepository;

    @Transactional
    public ProjectDocument register(ProjectDocumentRegisterRequest request) {
        ProjectDocument doc = ProjectDocument.builder()
                .projectId(request.getProjectId())
                .documentId(request.getDocumentId())
                .originalFilename(request.getOriginalFilename())
                .fileType(request.getFileType())
                .fileSize(request.getFileSize())
                .build();
        return projectDocumentRepository.save(doc);
    }

    public int getDocumentCount(Long projectId) {
        return projectDocumentRepository.countByProjectIdAndActSt(projectId, "ACTIVATE");
    }

    @Transactional
    public void softDelete(Long documentId) {
        projectDocumentRepository.findByDocumentId(documentId)
                .ifPresent(ProjectDocument::softDelete);
    }
}
