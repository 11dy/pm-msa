package com.pm.pmresource.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ResourceException extends RuntimeException {

    private final HttpStatus status;

    public ResourceException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public static ResourceException notFound(String resource) {
        return new ResourceException(resource + "을(를) 찾을 수 없습니다", HttpStatus.NOT_FOUND);
    }

    public static ResourceException forbidden() {
        return new ResourceException("접근 권한이 없습니다", HttpStatus.FORBIDDEN);
    }
}
