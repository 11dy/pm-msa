package com.dy.dyauth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OAuth2UrlResponse {

    private String provider;
    private String authorizationUrl;

    public static OAuth2UrlResponse of(String provider, String authorizationUrl) {
        return new OAuth2UrlResponse(provider, authorizationUrl);
    }
}
