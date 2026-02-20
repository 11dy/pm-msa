package com.pm.pmworkflow.dto.response;

import com.pm.pmworkflow.domain.entity.Agent;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AgentResponse {

    private Long id;
    private String name;
    private String description;
    private String systemPrompt;
    private String model;
    private Double temperature;
    private Integer maxTokens;
    private String tools;
    private Boolean isDefault;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AgentResponse from(Agent agent) {
        return AgentResponse.builder()
                .id(agent.getId())
                .name(agent.getName())
                .description(agent.getDescription())
                .systemPrompt(agent.getSystemPrompt())
                .model(agent.getModel())
                .temperature(agent.getTemperature())
                .maxTokens(agent.getMaxTokens())
                .tools(agent.getTools())
                .isDefault(agent.getIsDefault())
                .isActive(agent.getIsActive())
                .createdAt(agent.getCreatedAt())
                .updatedAt(agent.getUpdatedAt())
                .build();
    }
}
