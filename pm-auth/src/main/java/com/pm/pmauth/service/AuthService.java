package com.pm.pmauth.service;

import com.pm.pmauth.domain.entity.RefreshToken;
import com.pm.pmauth.domain.entity.User;
import com.pm.pmauth.domain.entity.UserAuth;
import com.pm.pmauth.domain.repository.RefreshTokenRepository;
import com.pm.pmauth.domain.repository.UserAuthRepository;
import com.pm.pmauth.domain.repository.UserRepository;
import com.pm.pmauth.dto.request.LoginRequest;
import com.pm.pmauth.dto.request.SignUpRequest;
import com.pm.pmauth.dto.request.TokenRefreshRequest;
import com.pm.pmauth.dto.response.TokenResponse;
import com.pm.pmauth.dto.response.UserResponse;
import com.pm.pmauth.exception.AuthException;
import com.pm.pmauth.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserResponse signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AuthException.emailAlreadyExists();
        }

        User user = User.builder()
                .email(request.getEmail())
                .userNm(request.getUserNm())
                .role("ROLE_USER")
                .build();

        User savedUser = userRepository.save(user);

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        UserAuth userAuth = UserAuth.createLocalAuth(savedUser.getId(), encodedPassword);
        userAuthRepository.save(userAuth);

        log.info("User signed up: {}", savedUser.getEmail());

        return UserResponse.from(savedUser);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        UserAuth userAuth = userAuthRepository.findLocalAuthByEmail(request.getEmail())
                .orElseThrow(AuthException::invalidCredentials);

        if (!passwordEncoder.matches(request.getPassword(), userAuth.getPassword())) {
            throw AuthException.invalidCredentials();
        }

        User user = userRepository.findById(userAuth.getUserId())
                .orElseThrow(AuthException::userNotFound);

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        long refreshTokenExpirationMillis = jwtTokenProvider.getRefreshTokenExpirationMillis();
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpirationMillis / 1000);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshToken)
                .deviceInfo(request.getDeviceInfo())
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        log.info("User logged in: {}", user.getEmail());

        return TokenResponse.of(accessToken, refreshToken, refreshTokenExpirationMillis / 1000);
    }

    @Transactional
    public TokenResponse refreshToken(TokenRefreshRequest request) {
        RefreshToken refreshTokenEntity = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(AuthException::invalidRefreshToken);

        if (refreshTokenEntity.isExpired()) {
            refreshTokenRepository.delete(refreshTokenEntity);
            throw AuthException.expiredRefreshToken();
        }

        User user = userRepository.findById(refreshTokenEntity.getUserId())
                .orElseThrow(AuthException::userNotFound);

        String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        long refreshTokenExpirationMillis = jwtTokenProvider.getRefreshTokenExpirationMillis();
        LocalDateTime newExpiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpirationMillis / 1000);

        refreshTokenEntity.updateToken(newRefreshToken, newExpiresAt);

        log.info("Token refreshed for user: {}", user.getEmail());

        return TokenResponse.of(newAccessToken, newRefreshToken, refreshTokenExpirationMillis / 1000);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);

        log.info("User logged out");
    }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(AuthException::userNotFound);
        return UserResponse.from(user);
    }
}
