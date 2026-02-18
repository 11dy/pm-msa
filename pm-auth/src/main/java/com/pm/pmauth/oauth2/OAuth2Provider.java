package com.pm.pmauth.oauth2;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OAuth2Provider {
    LOCAL("local"),
    GOOGLE("google"),
    KAKAO("kakao"),
    NAVER("naver");

    private final String registrationId;

    public static OAuth2Provider fromString(String provider) {
        for (OAuth2Provider p : values()) {
            if (p.registrationId.equalsIgnoreCase(provider)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Unknown OAuth2 provider: " + provider);
    }
}
