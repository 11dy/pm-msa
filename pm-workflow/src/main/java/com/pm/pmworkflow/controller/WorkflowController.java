package com.pm.pmworkflow.controller;

import com.pm.pmworkflow.domain.entity.WorkflowExecution;
import com.pm.pmworkflow.domain.repository.WorkflowExecutionRepository;
import com.pm.pmworkflow.dto.response.ApiResponse;
import com.pm.pmworkflow.exception.WorkflowException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowExecutionRepository workflowExecutionRepository;

    @GetMapping("/executions/{id}")
    public ResponseEntity<ApiResponse<?>> getExecution(@PathVariable Long id) {
        WorkflowExecution execution = workflowExecutionRepository.findById(id)
                .orElseThrow(() -> WorkflowException.notFound("워크플로우 실행"));
        return ResponseEntity.ok(ApiResponse.success(execution));
    }
}
