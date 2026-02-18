package com.pm.pmauth.controller;

import com.pm.pmauth.dto.request.LoginRequest;
import com.pm.pmauth.dto.request.SignUpRequest;
import com.pm.pmauth.dto.request.TokenRefreshRequest;
import com.pm.pmauth.dto.response.ApiResponse;
import com.pm.pmauth.dto.response.TokenResponse;
import com.pm.pmauth.dto.response.UserResponse;
import com.pm.pmauth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signUp(@Valid @RequestBody SignUpRequest request) {
        UserResponse response = authService.signUp(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("회원가입이 완료되었습니다", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("로그인 성공", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("토큰 갱신 성공", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody TokenRefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("로그아웃 성공", null));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        UserResponse response = authService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Void>> validateToken() {
        return ResponseEntity.ok(ApiResponse.success("유효한 토큰입니다", null));
    }
}
