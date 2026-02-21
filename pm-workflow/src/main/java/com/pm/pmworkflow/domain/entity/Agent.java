package com.pm.pmworkflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Agent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "system_prompt", nullable = false, columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(length = 50)
    @Builder.Default
    private String model = "gpt-4o";

    @Column(precision = 3)
    @Builder.Default
    private Double temperature = 0.7;

    @Column(name = "max_tokens")
    @Builder.Default
    private Integer maxTokens = 4096;

    @Column(columnDefinition = "JSON")
    private String tools;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    public void update(String name, String description, String systemPrompt,
                       String model, Double temperature, Integer maxTokens, String tools) {
        this.name = name;
        this.description = description;
        this.systemPrompt = systemPrompt;
        this.model = model;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
        this.tools = tools;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
