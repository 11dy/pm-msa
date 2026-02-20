package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.Conversation;
import com.pm.pmworkflow.domain.enums.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, ConversationStatus status);
}
