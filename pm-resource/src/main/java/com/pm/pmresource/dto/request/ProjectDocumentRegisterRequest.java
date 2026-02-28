package com.pm.pmresource.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProjectDocumentRegisterRequest {

    @NotNull
    private Long projectId;

    @NotNull
    private Long documentId;

    private String originalFilename;
    private String fileType;
    private Long fileSize;
}
