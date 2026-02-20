package com.pm.pmworkflow.controller;

import com.pm.pmworkflow.dto.request.AgentCreateRequest;
import com.pm.pmworkflow.dto.request.AgentUpdateRequest;
import com.pm.pmworkflow.dto.response.AgentResponse;
import com.pm.pmworkflow.dto.response.ApiResponse;
import com.pm.pmworkflow.service.AgentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AgentResponse>>> getAgents(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        var agents = agentService.getAgents(userId).stream()
                .map(AgentResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(agents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AgentResponse>> getAgent(@PathVariable Long id) {
        var agent = agentService.getAgent(id);
        return ResponseEntity.ok(ApiResponse.success(AgentResponse.from(agent)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AgentResponse>> createAgent(
            Authentication auth, @Valid @RequestBody AgentCreateRequest request) {
        Long userId = Long.parseLong(auth.getName());
        var agent = agentService.createAgent(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(AgentResponse.from(agent)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AgentResponse>> updateAgent(
            @PathVariable Long id, @Valid @RequestBody AgentUpdateRequest request) {
        var agent = agentService.updateAgent(id, request);
        return ResponseEntity.ok(ApiResponse.success(AgentResponse.from(agent)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
