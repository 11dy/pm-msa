package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    List<Agent> findByUserIdAndIsActiveTrue(Long userId);
}
