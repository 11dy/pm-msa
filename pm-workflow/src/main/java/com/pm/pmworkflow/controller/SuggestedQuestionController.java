package com.pm.pmworkflow.controller;

import com.pm.pmworkflow.dto.response.SuggestedQuestionResponse;
import com.pm.pmworkflow.service.SuggestedQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class SuggestedQuestionController {

    private final SuggestedQuestionService suggestedQuestionService;

    @GetMapping("/suggestions")
    public ResponseEntity<List<SuggestedQuestionResponse>> getSuggestions(
            @RequestParam Long projectId) {
        return ResponseEntity.ok(suggestedQuestionService.getByProjectId(projectId));
    }
}
