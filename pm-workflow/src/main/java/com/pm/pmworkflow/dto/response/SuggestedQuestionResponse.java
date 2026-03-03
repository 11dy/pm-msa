package com.pm.pmworkflow.dto.response;

import com.pm.pmworkflow.domain.entity.SuggestedQuestion;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SuggestedQuestionResponse {

    private Long id;
    private Long documentId;
    private Long projectId;
    private String question;
    private String questionType;
    private LocalDateTime createdAt;

    public static SuggestedQuestionResponse from(SuggestedQuestion entity) {
        return SuggestedQuestionResponse.builder()
                .id(entity.getId())
                .documentId(entity.getDocumentId())
                .projectId(entity.getProjectId())
                .question(entity.getQuestion())
                .questionType(entity.getQuestionType())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
