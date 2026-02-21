package com.pm.pmworkflow.service;

import com.pm.pmworkflow.domain.entity.Conversation;
import com.pm.pmworkflow.domain.entity.Message;
import com.pm.pmworkflow.domain.enums.ConversationStatus;
import com.pm.pmworkflow.domain.repository.ConversationRepository;
import com.pm.pmworkflow.domain.repository.MessageRepository;
import com.pm.pmworkflow.dto.request.ConversationCreateRequest;
import com.pm.pmworkflow.exception.WorkflowException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public List<Conversation> getConversations(Long userId) {
        return conversationRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(
                userId, ConversationStatus.ACTIVE);
    }

    public Conversation getConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> WorkflowException.notFound("대화"));
    }

    public List<Message> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional
    public Conversation createConversation(Long userId, ConversationCreateRequest request) {
        Conversation conversation = Conversation.builder()
                .userId(userId)
                .agentId(request.getAgentId())
                .title(request.getTitle())
                .build();
        return conversationRepository.save(conversation);
    }

    @Transactional
    public void deleteConversation(Long id) {
        Conversation conversation = getConversation(id);
        conversation.markDeleted();
    }
}
