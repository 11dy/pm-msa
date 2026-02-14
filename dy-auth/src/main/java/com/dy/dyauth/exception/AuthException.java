package com.dy.dyauth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AuthException extends RuntimeException {

    private final HttpStatus status;

    public AuthException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public AuthException(String message, int statusCode) {
        super(message);
        this.status = HttpStatus.valueOf(statusCode);
    }

    public static AuthException emailAlreadyExists() {
        return new AuthException("이미 사용 중인 이메일입니다", HttpStatus.CONFLICT);
    }

    public static AuthException userNotFound() {
        return new AuthException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND);
    }

    public static AuthException invalidCredentials() {
        return new AuthException("이메일 또는 비밀번호가 올바르지 않습니다", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException invalidRefreshToken() {
        return new AuthException("유효하지 않은 Refresh Token입니다", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException expiredRefreshToken() {
        return new AuthException("만료된 Refresh Token입니다", HttpStatus.UNAUTHORIZED);
    }
}
