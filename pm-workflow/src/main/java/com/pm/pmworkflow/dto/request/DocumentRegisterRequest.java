package com.pm.pmworkflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DocumentRegisterRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String filename;

    @NotBlank
    private String originalFilename;

    @NotBlank
    private String fileType;

    @NotNull
    private Long fileSize;

    @NotBlank
    private String storagePath;
}
