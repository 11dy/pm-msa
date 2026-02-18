package com.pm.pmauth.oauth2.userinfo;

import com.pm.pmauth.oauth2.OAuth2Provider;

public interface OAuth2UserInfo {

    OAuth2Provider getProvider();

    String getProviderId();

    String getEmail();

    String getName();

    String getProfileImage();
}
