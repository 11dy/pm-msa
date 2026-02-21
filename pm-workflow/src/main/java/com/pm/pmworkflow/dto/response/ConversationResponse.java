package com.pm.pmworkflow.dto.response;

import com.pm.pmworkflow.domain.entity.Conversation;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ConversationResponse {

    private Long id;
    private Long agentId;
    private String title;
    private String summary;
    private String status;
    private Integer messageCount;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;

    public static ConversationResponse from(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .agentId(conversation.getAgentId())
                .title(conversation.getTitle())
                .summary(conversation.getSummary())
                .status(conversation.getStatus().name())
                .messageCount(conversation.getMessageCount())
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                .build();
    }
}
