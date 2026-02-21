package com.pm.pmworkflow.domain.entity;

import com.pm.pmworkflow.domain.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_executions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class WorkflowExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "workflow_type", nullable = false, length = 50)
    private String workflowType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkflowStatus status = WorkflowStatus.PENDING;

    @Column(name = "graph_state", columnDefinition = "JSON")
    private String graphState;

    @Column(name = "nodes_executed", columnDefinition = "JSON")
    private String nodesExecuted;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void start() {
        this.status = WorkflowStatus.RUNNING;
        this.startedAt = LocalDateTime.now();
    }

    public void complete(String nodesExecuted) {
        this.status = WorkflowStatus.COMPLETED;
        this.nodesExecuted = nodesExecuted;
        this.completedAt = LocalDateTime.now();
    }

    public void fail(String errorMessage) {
        this.status = WorkflowStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
    }
}
