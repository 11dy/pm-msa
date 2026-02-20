package com.pm.pmworkflow.dto.response;

import com.pm.pmworkflow.domain.entity.Message;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MessageResponse {

    private Long id;
    private String role;
    private String content;
    private String metadata;
    private Integer tokenCount;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .role(message.getRole().name())
                .content(message.getContent())
                .metadata(message.getMetadata())
                .tokenCount(message.getTokenCount())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
