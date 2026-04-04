package com.pm.pmworkflow.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProjectUpdateRequest {

    @Size(max = 200, message = "프로젝트명은 200자 이하여야 합니다")
    private String name;

    private String description;
}
