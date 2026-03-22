package com.pm.pmworkflow.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.pmworkflow.domain.entity.Document;
import com.pm.pmworkflow.domain.entity.SuggestedQuestion;
import com.pm.pmworkflow.domain.entity.WorkflowExecution;
import com.pm.pmworkflow.domain.enums.DocumentStatus;
import com.pm.pmworkflow.domain.repository.DocumentRepository;
import com.pm.pmworkflow.domain.repository.WorkflowExecutionRepository;
import com.pm.pmworkflow.service.SuggestedQuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkflowEventConsumer {

    private final DocumentRepository documentRepository;
    private final WorkflowExecutionRepository workflowExecutionRepository;
    private final SuggestedQuestionService suggestedQuestionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "pm.document.events", groupId = "pm-workflow-group")
    public void handleDocumentEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.get("type").asText();
            Long documentId = event.get("documentId").asLong();

            log.info("Document event received: type={}, documentId={}", eventType, documentId);

            switch (eventType) {
                case "document.embedding.started" -> {
                    documentRepository.findById(documentId).ifPresent(doc -> {
                        doc.updateStatus(DocumentStatus.PROCESSING);
                        documentRepository.save(doc);
                    });
                }
                case "document.embedding.completed" -> {
                    documentRepository.findById(documentId).ifPresent(doc -> {
                        int embeddingCount = event.get("embeddingCount").asInt();
                        doc.updateChunkCount(embeddingCount);
                        doc.updateStatus(DocumentStatus.COMPLETED);
                        documentRepository.save(doc);
                    });
                }
                case "document.failed" -> {
                    documentRepository.findById(documentId).ifPresent(doc -> {
                        String error = event.get("error").asText();
                        doc.fail(error);
                        documentRepository.save(doc);
                    });
                }
                case "document.analysis.completed" -> {
                    Long projectId = event.has("projectId") ? event.get("projectId").asLong() : null;
                    JsonNode questionsNode = event.get("suggestedQuestions");
                    if (questionsNode != null && questionsNode.isArray()) {
                        java.util.ArrayList<SuggestedQuestion> questions = new java.util.ArrayList<>();
                        for (JsonNode q : questionsNode) {
                            questions.add(SuggestedQuestion.builder()
                                    .documentId(documentId)
                                    .projectId(projectId)
                                    .question(q.get("question").asText())
                                    .questionType(q.has("type") ? q.get("type").asText() : "document")
                                    .build());
                        }
                        suggestedQuestionService.saveAll(questions);
                        log.info("Saved {} suggested questions for document {}", questions.size(), documentId);
                    }
                }
            }

            // WebSocket으로 프론트엔드에 상태 전파
            messagingTemplate.convertAndSend(
                    "/topic/documents/" + documentId, message);

        } catch (Exception e) {
            log.error("Failed to process document event: {}", message, e);
        }
    }

    @KafkaListener(topics = "pm.workflow.events", groupId = "pm-workflow-group")
    public void handleWorkflowEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.get("type").asText();
            Long executionId = event.get("executionId").asLong();

            log.info("Workflow event received: type={}, executionId={}", eventType, executionId);

            switch (eventType) {
                case "workflow.started" -> {
                    workflowExecutionRepository.findById(executionId)
                            .ifPresent(WorkflowExecution::start);
                }
                case "workflow.completed" -> {
                    workflowExecutionRepository.findById(executionId).ifPresent(exec -> {
                        String nodesExecuted = event.get("nodesExecuted").toString();
                        exec.complete(nodesExecuted);
                        workflowExecutionRepository.save(exec);
                    });
                }
                case "workflow.failed" -> {
                    workflowExecutionRepository.findById(executionId).ifPresent(exec -> {
                        String error = event.get("error").asText();
                        exec.fail(error);
                        workflowExecutionRepository.save(exec);
                    });
                }
            }

            // WebSocket으로 프론트엔드에 실시간 전파
            messagingTemplate.convertAndSend(
                    "/topic/workflows/" + executionId, message);

        } catch (Exception e) {
            log.error("Failed to process workflow event: {}", message, e);
        }
    }
}
