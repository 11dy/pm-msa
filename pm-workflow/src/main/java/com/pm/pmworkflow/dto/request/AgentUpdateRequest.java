package com.pm.pmworkflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AgentUpdateRequest {

    @NotBlank(message = "에이전트 이름은 필수입니다")
    @Size(max = 100)
    private String name;

    private String description;

    @NotBlank(message = "시스템 프롬프트는 필수입니다")
    private String systemPrompt;

    private String model;
    private Double temperature;
    private Integer maxTokens;
    private String tools;
}
