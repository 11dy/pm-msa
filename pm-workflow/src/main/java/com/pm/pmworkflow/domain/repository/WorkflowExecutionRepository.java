package com.pm.pmworkflow.domain.repository;

import com.pm.pmworkflow.domain.entity.WorkflowExecution;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowExecutionRepository extends JpaRepository<WorkflowExecution, Long> {
}
