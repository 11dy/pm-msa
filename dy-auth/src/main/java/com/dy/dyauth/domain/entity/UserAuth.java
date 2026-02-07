package com.dy.dyauth.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_auth")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserAuth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(name = "provider_id")
    private String providerId;

    private String password;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public UserAuth(User user, String provider, String providerId, String password) {
        this.user = user;
        this.provider = provider;
        this.providerId = providerId;
        this.password = password;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static UserAuth createLocalAuth(User user, String encodedPassword) {
        return UserAuth.builder()
                .user(user)
                .provider("LOCAL")
                .password(encodedPassword)
                .build();
    }

    public static UserAuth createOAuthAuth(User user, String provider, String providerId) {
        return UserAuth.builder()
                .user(user)
                .provider(provider)
                .providerId(providerId)
                .build();
    }
}
