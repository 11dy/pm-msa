package com.dy.dyauth.oauth2.userinfo;

import com.dy.dyauth.oauth2.OAuth2Provider;

public interface OAuth2UserInfo {

    OAuth2Provider getProvider();

    String getProviderId();

    String getEmail();

    String getName();

    String getProfileImage();
}
