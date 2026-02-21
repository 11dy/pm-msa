package com.pm.pmworkflow.controller;

import com.pm.pmworkflow.dto.request.ConversationCreateRequest;
import com.pm.pmworkflow.dto.response.*;
import com.pm.pmworkflow.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        var conversations = conversationService.getConversations(userId).stream()
                .map(ConversationResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationDetailResponse>> getConversation(@PathVariable Long id) {
        var conversation = conversationService.getConversation(id);
        var messages = conversationService.getMessages(id).stream()
                .map(MessageResponse::from)
                .toList();
        var detail = ConversationDetailResponse.builder()
                .conversation(ConversationResponse.from(conversation))
                .messages(messages)
                .build();
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            Authentication auth, @Valid @RequestBody ConversationCreateRequest request) {
        Long userId = Long.parseLong(auth.getName());
        var conversation = conversationService.createConversation(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ConversationResponse.from(conversation)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
