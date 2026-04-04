package com.pm.pmworkflow.service;

import com.pm.pmworkflow.domain.entity.Project;
import com.pm.pmworkflow.domain.repository.DocumentRepository;
import com.pm.pmworkflow.domain.repository.ProjectRepository;
import com.pm.pmworkflow.dto.request.ProjectCreateRequest;
import com.pm.pmworkflow.dto.request.ProjectUpdateRequest;
import com.pm.pmworkflow.dto.response.ProjectResponse;
import com.pm.pmworkflow.exception.WorkflowException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;

    public List<ProjectResponse> getProjectsWithDocumentCount(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(project -> ProjectResponse.from(
                        project,
                        documentRepository.countByProjectIdAndActSt(project.getId(), "ACTIVATE")))
                .toList();
    }

    public List<Project> getProjects(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Project createProject(Long userId, ProjectCreateRequest request) {
        Project project = Project.builder()
                .userId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .build();
        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Long id, Long userId, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> WorkflowException.notFound("프로젝트"));
        if (!project.getUserId().equals(userId)) {
            throw WorkflowException.forbidden();
        }
        project.update(request.getName(), request.getDescription());
        return project;
    }
}
