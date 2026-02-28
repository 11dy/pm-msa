package com.pm.pmresource.dto.response;

import com.pm.pmresource.domain.entity.Project;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int documentCount;

    public static ProjectResponse from(Project project) {
        return from(project, 0);
    }

    public static ProjectResponse from(Project project, int documentCount) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .documentCount(documentCount)
                .build();
    }
}
