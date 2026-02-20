package com.pm.pmworkflow.service;

import com.pm.pmworkflow.domain.entity.Agent;
import com.pm.pmworkflow.domain.repository.AgentRepository;
import com.pm.pmworkflow.dto.request.AgentCreateRequest;
import com.pm.pmworkflow.dto.request.AgentUpdateRequest;
import com.pm.pmworkflow.exception.WorkflowException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AgentService {

    private final AgentRepository agentRepository;

    public List<Agent> getAgents(Long userId) {
        return agentRepository.findByUserIdAndIsActiveTrue(userId);
    }

    public Agent getAgent(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> WorkflowException.notFound("에이전트"));
    }

    @Transactional
    public Agent createAgent(Long userId, AgentCreateRequest request) {
        Agent agent = Agent.builder()
                .userId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .systemPrompt(request.getSystemPrompt())
                .model(request.getModel() != null ? request.getModel() : "gpt-4o")
                .temperature(request.getTemperature() != null ? request.getTemperature() : 0.7)
                .maxTokens(request.getMaxTokens() != null ? request.getMaxTokens() : 4096)
                .tools(request.getTools())
                .build();
        return agentRepository.save(agent);
    }

    @Transactional
    public Agent updateAgent(Long id, AgentUpdateRequest request) {
        Agent agent = getAgent(id);
        agent.update(
                request.getName(),
                request.getDescription(),
                request.getSystemPrompt(),
                request.getModel() != null ? request.getModel() : agent.getModel(),
                request.getTemperature() != null ? request.getTemperature() : agent.getTemperature(),
                request.getMaxTokens() != null ? request.getMaxTokens() : agent.getMaxTokens(),
                request.getTools()
        );
        return agent;
    }

    @Transactional
    public void deleteAgent(Long id) {
        Agent agent = getAgent(id);
        agent.deactivate();
    }
}
