package com.pm.pmworkflow.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ConversationDetailResponse {

    private ConversationResponse conversation;
    private List<MessageResponse> messages;
}
