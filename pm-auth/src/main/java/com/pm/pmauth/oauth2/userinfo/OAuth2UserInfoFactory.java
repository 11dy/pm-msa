package com.pm.pmauth.oauth2.userinfo;

import com.pm.pmauth.oauth2.OAuth2Provider;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo create(OAuth2Provider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> new GoogleUserInfo(attributes);
            case KAKAO -> new KakaoUserInfo(attributes);
            case NAVER -> new NaverUserInfo(attributes);
            default -> throw new IllegalArgumentException("Unsupported OAuth2 provider: " + provider);
        };
    }
}
