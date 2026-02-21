package com.pm.pmworkflow.domain.entity;

import com.pm.pmworkflow.domain.enums.ConversationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Conversation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    public void updateTitle(String title) {
        this.title = title;
    }

    public void incrementMessageCount() {
        this.messageCount++;
        this.lastMessageAt = LocalDateTime.now();
    }

    public void archive() {
        this.status = ConversationStatus.ARCHIVED;
    }

    public void markDeleted() {
        this.status = ConversationStatus.DELETED;
    }
}
