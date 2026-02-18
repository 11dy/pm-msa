package com.pm.pmauth.service;

import com.pm.pmauth.domain.entity.RefreshToken;
import com.pm.pmauth.domain.entity.User;
import com.pm.pmauth.domain.entity.UserAuth;
import com.pm.pmauth.domain.repository.RefreshTokenRepository;
import com.pm.pmauth.domain.repository.UserAuthRepository;
import com.pm.pmauth.domain.repository.UserRepository;
import com.pm.pmauth.dto.response.TokenResponse;
import com.pm.pmauth.exception.AuthException;
import com.pm.pmauth.oauth2.OAuth2Provider;
import com.pm.pmauth.oauth2.client.OAuth2Client;
import com.pm.pmauth.oauth2.client.OAuth2ClientFactory;
import com.pm.pmauth.oauth2.userinfo.OAuth2UserInfo;
import com.pm.pmauth.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OAuth2Service {

    private final OAuth2ClientFactory oAuth2ClientFactory;
    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public String generateAuthorizationUrl(String providerName) {
        OAuth2Provider provider = OAuth2Provider.fromString(providerName);
        OAuth2Client client = oAuth2ClientFactory.getClient(provider);

        String state = UUID.randomUUID().toString();
        return client.generateAuthorizationUrl(state);
    }

    @Transactional
    public TokenResponse processCallback(String providerName, String code, String deviceInfo) {
        OAuth2Provider provider = OAuth2Provider.fromString(providerName);
        OAuth2Client client = oAuth2ClientFactory.getClient(provider);

        String accessToken = client.getAccessToken(code);
        OAuth2UserInfo userInfo = client.getUserInfo(accessToken);

        User user = findOrCreateUser(provider, userInfo);

        return createTokenResponse(user, deviceInfo);
    }

    @Transactional
    public void linkSocialAccount(Long userId, String providerName, String code) {
        OAuth2Provider provider = OAuth2Provider.fromString(providerName);

        if (userAuthRepository.existsByUserIdAndProvider(userId, provider.name())) {
            throw new AuthException("이미 연동된 소셜 계정입니다.", 409);
        }

        OAuth2Client client = oAuth2ClientFactory.getClient(provider);
        String accessToken = client.getAccessToken(code);
        OAuth2UserInfo userInfo = client.getUserInfo(accessToken);

        Optional<UserAuth> existingAuth = userAuthRepository.findByProviderAndProviderId(
                provider.name(), userInfo.getProviderId());

        if (existingAuth.isPresent()) {
            throw new AuthException("해당 소셜 계정은 이미 다른 사용자에게 연동되어 있습니다.", 409);
        }

        if (!userRepository.existsById(userId)) {
            throw AuthException.userNotFound();
        }

        UserAuth userAuth = UserAuth.createOAuthAuth(userId, provider.name(), userInfo.getProviderId());
        userAuthRepository.save(userAuth);

        log.info("Social account linked: userId={}, provider={}", userId, provider);
    }

    @Transactional
    public void unlinkSocialAccount(Long userId, String providerName) {
        OAuth2Provider provider = OAuth2Provider.fromString(providerName);

        if (provider == OAuth2Provider.LOCAL) {
            throw new AuthException("LOCAL 인증은 연동 해제할 수 없습니다.", 400);
        }

        List<UserAuth> userAuths = userAuthRepository.findAllByUserId(userId);

        if (userAuths.size() <= 1) {
            throw new AuthException("최소 하나의 인증 방식이 필요합니다.", 400);
        }

        UserAuth authToRemove = userAuths.stream()
                .filter(auth -> auth.getProvider().equals(provider.name()))
                .findFirst()
                .orElseThrow(() -> new AuthException("연동되지 않은 소셜 계정입니다.", 404));

        userAuthRepository.delete(authToRemove);

        log.info("Social account unlinked: userId={}, provider={}", userId, provider);
    }

    public List<String> getLinkedProviders(Long userId) {
        return userAuthRepository.findAllByUserId(userId).stream()
                .map(UserAuth::getProvider)
                .toList();
    }

    private User findOrCreateUser(OAuth2Provider provider, OAuth2UserInfo userInfo) {
        Optional<UserAuth> existingAuth = userAuthRepository.findByProviderAndProviderId(
                provider.name(), userInfo.getProviderId());

        if (existingAuth.isPresent()) {
            log.info("Existing OAuth user logged in: provider={}, email={}", provider, userInfo.getEmail());
            return userRepository.findById(existingAuth.get().getUserId())
                    .orElseThrow(AuthException::userNotFound);
        }

        String email = userInfo.getEmail();
        if (email == null || email.isBlank()) {
            // 이메일이 없는 경우 (카카오 등) provider_id 기반 임시 이메일 생성
            email = provider.name().toLowerCase() + "_" + userInfo.getProviderId() + "@oauth.local";
            log.info("Email not provided, generated temporary email: {}", email);
        }

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            UserAuth newAuth = UserAuth.createOAuthAuth(user.getId(), provider.name(), userInfo.getProviderId());
            userAuthRepository.save(newAuth);
            log.info("OAuth account linked to existing user: provider={}, email={}", provider, email);
            return user;
        }

        User newUser = User.builder()
                .email(email)
                .userNm(userInfo.getName())
                .role("ROLE_USER")
                .build();

        User savedUser = userRepository.save(newUser);

        UserAuth newAuth = UserAuth.createOAuthAuth(savedUser.getId(), provider.name(), userInfo.getProviderId());
        userAuthRepository.save(newAuth);

        log.info("New OAuth user created: provider={}, email={}", provider, email);

        return savedUser;
    }

    private TokenResponse createTokenResponse(User user, String deviceInfo) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        long refreshTokenExpirationMillis = jwtTokenProvider.getRefreshTokenExpirationMillis();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpirationMillis / 1000);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshToken)
                .deviceInfo(deviceInfo)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        return TokenResponse.of(accessToken, refreshToken, refreshTokenExpirationMillis / 1000);
    }
}
