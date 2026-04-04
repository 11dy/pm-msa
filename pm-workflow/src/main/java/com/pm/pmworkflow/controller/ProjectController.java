package com.pm.pmworkflow.controller;

import com.pm.pmworkflow.domain.entity.Project;
import com.pm.pmworkflow.dto.request.ProjectCreateRequest;
import com.pm.pmworkflow.dto.request.ProjectUpdateRequest;
import com.pm.pmworkflow.dto.response.ApiResponse;
import com.pm.pmworkflow.dto.response.ProjectResponse;
import com.pm.pmworkflow.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjects(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        List<ProjectResponse> projects = projectService.getProjectsWithDocumentCount(userId);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            Authentication auth, @Valid @RequestBody ProjectCreateRequest request) {
        Long userId = Long.parseLong(auth.getName());
        Project project = projectService.createProject(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProjectResponse.from(project)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id, Authentication auth,
            @Valid @RequestBody ProjectUpdateRequest request) {
        Long userId = Long.parseLong(auth.getName());
        Project project = projectService.updateProject(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success(ProjectResponse.from(project)));
    }
}
