package com.pm.pmresource.service;

import com.pm.pmresource.domain.entity.Project;
import com.pm.pmresource.domain.repository.ProjectRepository;
import com.pm.pmresource.dto.request.ProjectCreateRequest;
import com.pm.pmresource.dto.request.ProjectUpdateRequest;
import com.pm.pmresource.exception.ResourceException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;

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
                .orElseThrow(() -> ResourceException.notFound("프로젝트"));
        if (!project.getUserId().equals(userId)) {
            throw ResourceException.forbidden();
        }
        project.update(request.getName(), request.getDescription());
        return project;
    }
}
