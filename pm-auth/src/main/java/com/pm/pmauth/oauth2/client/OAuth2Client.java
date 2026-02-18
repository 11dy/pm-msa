package com.pm.pmauth.oauth2.client;

import com.pm.pmauth.oauth2.OAuth2Provider;
import com.pm.pmauth.oauth2.userinfo.OAuth2UserInfo;

public interface OAuth2Client {

    OAuth2Provider getProvider();

    String generateAuthorizationUrl(String state);

    String getAccessToken(String code);

    OAuth2UserInfo getUserInfo(String accessToken);
}
