package com.pm.pmworkflow.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ConversationCreateRequest {

    @NotNull(message = "에이전트 ID는 필수입니다")
    private Long agentId;

    private String title;
}
