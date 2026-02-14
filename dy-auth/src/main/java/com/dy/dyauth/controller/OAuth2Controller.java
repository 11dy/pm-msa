package com.dy.dyauth.controller;

import com.dy.dyauth.dto.response.ApiResponse;
import com.dy.dyauth.dto.response.LinkedProvidersResponse;
import com.dy.dyauth.dto.response.OAuth2UrlResponse;
import com.dy.dyauth.dto.response.TokenResponse;
import com.dy.dyauth.service.OAuth2Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth/oauth2")
@RequiredArgsConstructor
@Tag(name = "OAuth2 Authentication", description = "소셜 로그인 API")
public class OAuth2Controller {

    private final OAuth2Service oAuth2Service;

    @GetMapping("/{provider}")
    @Operation(summary = "소셜 로그인 URL 조회", description = "지정된 소셜 로그인 제공자의 인증 URL을 반환합니다")
    public ResponseEntity<ApiResponse<OAuth2UrlResponse>> getAuthorizationUrl(
            @Parameter(description = "소셜 로그인 제공자 (google, kakao, naver)")
            @PathVariable String provider) {

        log.debug("Generating authorization URL for provider: {}", provider);

        String authorizationUrl = oAuth2Service.generateAuthorizationUrl(provider);
        OAuth2UrlResponse response = OAuth2UrlResponse.of(provider, authorizationUrl);

        return ResponseEntity.ok(ApiResponse.success("인증 URL 생성 완료", response));
    }

    @GetMapping("/callback/{provider}")
    @Operation(summary = "소셜 로그인 콜백", description = "소셜 로그인 인증 완료 후 콜백을 처리하고 JWT 토큰을 발급합니다")
    public ResponseEntity<ApiResponse<TokenResponse>> callback(
            @Parameter(description = "소셜 로그인 제공자 (google, kakao, naver)")
            @PathVariable String provider,
            @Parameter(description = "인증 코드")
            @RequestParam String code,
            @Parameter(description = "상태 값 (CSRF 방지)")
            @RequestParam(required = false) String state,
            @Parameter(description = "디바이스 정보")
            @RequestHeader(value = "X-Device-Info", required = false) String deviceInfo) {

        log.debug("Processing OAuth2 callback for provider: {}, code: {}", provider, code);

        TokenResponse tokenResponse = oAuth2Service.processCallback(provider, code, deviceInfo);

        return ResponseEntity.ok(ApiResponse.success("로그인 성공", tokenResponse));
    }

    @PostMapping("/link/{provider}")
    @Operation(summary = "소셜 계정 연동", description = "기존 계정에 소셜 계정을 연동합니다")
    public ResponseEntity<ApiResponse<Void>> linkSocialAccount(
            @Parameter(description = "소셜 로그인 제공자 (google, kakao, naver)")
            @PathVariable String provider,
            @Parameter(description = "인증 코드")
            @RequestParam String code,
            @RequestHeader("X-User-Id") Long userId) {

        log.debug("Linking social account for userId: {}, provider: {}", userId, provider);

        oAuth2Service.linkSocialAccount(userId, provider, code);

        return ResponseEntity.ok(ApiResponse.success("소셜 계정 연동 완료", null));
    }

    @DeleteMapping("/link/{provider}")
    @Operation(summary = "소셜 계정 연동 해제", description = "연동된 소셜 계정을 해제합니다")
    public ResponseEntity<ApiResponse<Void>> unlinkSocialAccount(
            @Parameter(description = "소셜 로그인 제공자 (google, kakao, naver)")
            @PathVariable String provider,
            @RequestHeader("X-User-Id") Long userId) {

        log.debug("Unlinking social account for userId: {}, provider: {}", userId, provider);

        oAuth2Service.unlinkSocialAccount(userId, provider);

        return ResponseEntity.ok(ApiResponse.success("소셜 계정 연동 해제 완료", null));
    }

    @GetMapping("/providers")
    @Operation(summary = "연동된 소셜 계정 목록", description = "현재 사용자에게 연동된 소셜 계정 목록을 조회합니다")
    public ResponseEntity<ApiResponse<LinkedProvidersResponse>> getLinkedProviders(
            @RequestHeader("X-User-Id") Long userId) {

        log.debug("Getting linked providers for userId: {}", userId);

        var providers = oAuth2Service.getLinkedProviders(userId);
        LinkedProvidersResponse response = LinkedProvidersResponse.of(providers);

        return ResponseEntity.ok(ApiResponse.success("연동된 소셜 계정 목록 조회 완료", response));
    }
}
