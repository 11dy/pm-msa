package com.pm.pmworkflow.controller;

import com.pm.pmworkflow.dto.request.DocumentRegisterRequest;
import com.pm.pmworkflow.dto.response.DocumentResponse;
import com.pm.pmworkflow.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /**
     * 내부 API: pm-document 서비스가 호출하여 문서 메타데이터 등록
     */
    @PostMapping("/internal/register")
    public ResponseEntity<DocumentResponse> register(@Valid @RequestBody DocumentRegisterRequest request) {
        DocumentResponse response = documentService.register(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getDocuments(
            @RequestParam(required = false) Long projectId,
            Authentication authentication) {
        Long userId = Long.parseLong(authentication.getPrincipal().toString());
        if (projectId != null) {
            return ResponseEntity.ok(documentService.getDocumentsByProject(projectId));
        }
        return ResponseEntity.ok(documentService.getDocumentsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable Long id, Authentication authentication) {
        Long userId = Long.parseLong(authentication.getPrincipal().toString());
        return ResponseEntity.ok(documentService.getDocument(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id, Authentication authentication) {
        Long userId = Long.parseLong(authentication.getPrincipal().toString());
        documentService.deleteDocument(id, userId);
        return ResponseEntity.noContent().build();
    }
}
