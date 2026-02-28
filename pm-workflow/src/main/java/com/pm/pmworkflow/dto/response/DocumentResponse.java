package com.pm.pmworkflow.dto.response;

import com.pm.pmworkflow.domain.entity.Document;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DocumentResponse {

    private Long id;
    private Long userId;
    private Long projectId;
    private String filename;
    private String originalFilename;
    private String fileType;
    private Long fileSize;
    private String storagePath;
    private String status;
    private Integer chunkCount;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DocumentResponse from(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .projectId(document.getProjectId())
                .filename(document.getFilename())
                .originalFilename(document.getOriginalFilename())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .storagePath(document.getStoragePath())
                .status(document.getStatus().name())
                .chunkCount(document.getChunkCount())
                .errorMessage(document.getErrorMessage())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}
