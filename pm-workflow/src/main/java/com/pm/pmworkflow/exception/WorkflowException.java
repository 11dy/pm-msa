package com.pm.pmworkflow.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class WorkflowException extends RuntimeException {

    private final HttpStatus status;

    public WorkflowException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public static WorkflowException notFound(String resource) {
        return new WorkflowException(resource + "을(를) 찾을 수 없습니다", HttpStatus.NOT_FOUND);
    }

    public static WorkflowException forbidden() {
        return new WorkflowException("접근 권한이 없습니다", HttpStatus.FORBIDDEN);
    }
}
