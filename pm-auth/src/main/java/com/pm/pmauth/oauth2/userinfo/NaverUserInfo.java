package com.pm.pmauth.oauth2.userinfo;

import com.pm.pmauth.oauth2.OAuth2Provider;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RequiredArgsConstructor
public class NaverUserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    @Override
    public OAuth2Provider getProvider() {
        return OAuth2Provider.NAVER;
    }

    @Override
    public String getProviderId() {
        Map<String, Object> response = getResponse();
        if (response == null) {
            return null;
        }
        return (String) response.get("id");
    }

    @Override
    public String getEmail() {
        Map<String, Object> response = getResponse();
        if (response == null) {
            return null;
        }
        return (String) response.get("email");
    }

    @Override
    public String getName() {
        Map<String, Object> response = getResponse();
        if (response == null) {
            return null;
        }
        return (String) response.get("name");
    }

    @Override
    public String getProfileImage() {
        Map<String, Object> response = getResponse();
        if (response == null) {
            return null;
        }
        return (String) response.get("profile_image");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getResponse() {
        return (Map<String, Object>) attributes.get("response");
    }
}
