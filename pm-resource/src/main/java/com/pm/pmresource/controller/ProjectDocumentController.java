package com.pm.pmresource.controller;

import com.pm.pmresource.dto.request.ProjectDocumentRegisterRequest;
import com.pm.pmresource.dto.response.ApiResponse;
import com.pm.pmresource.service.ProjectDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/project-document")
@RequiredArgsConstructor
public class ProjectDocumentController {

    private final ProjectDocumentService projectDocumentService;

    @PostMapping("/internal/register")
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody ProjectDocumentRegisterRequest request) {
        projectDocumentService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(null));
    }

    @DeleteMapping("/internal/{documentId}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long documentId) {
        projectDocumentService.softDelete(documentId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
