package com.pm.pmauth.oauth2.client;

import com.pm.pmauth.oauth2.OAuth2Properties;
import com.pm.pmauth.oauth2.OAuth2Provider;
import com.pm.pmauth.oauth2.userinfo.KakaoUserInfo;
import com.pm.pmauth.oauth2.userinfo.OAuth2UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoOAuth2Client implements OAuth2Client {

    private final OAuth2Properties oAuth2Properties;
    private final WebClient webClient;

    @Override
    public OAuth2Provider getProvider() {
        return OAuth2Provider.KAKAO;
    }

    @Override
    public String generateAuthorizationUrl(String state) {
        OAuth2Properties.ProviderConfig config = oAuth2Properties.getProvider(OAuth2Provider.KAKAO);

        String scope = String.join(",", config.getScope());

        return config.getAuthorizationUri() +
                "?client_id=" + config.getClientId() +
                "&redirect_uri=" + URLEncoder.encode(config.getRedirectUri(), StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8) +
                "&state=" + state;
    }

    @Override
    public String getAccessToken(String code) {
        OAuth2Properties.ProviderConfig config = oAuth2Properties.getProvider(OAuth2Provider.KAKAO);

        Map<String, Object> response = webClient.post()
                .uri(config.getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "authorization_code")
                        .with("client_id", config.getClientId())
                        .with("client_secret", config.getClientSecret())
                        .with("redirect_uri", config.getRedirectUri())
                        .with("code", code))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("Failed to get access token from Kakao");
        }

        return (String) response.get("access_token");
    }

    @Override
    public OAuth2UserInfo getUserInfo(String accessToken) {
        OAuth2Properties.ProviderConfig config = oAuth2Properties.getProvider(OAuth2Provider.KAKAO);

        Map<String, Object> response = webClient.get()
                .uri(config.getUserInfoUri())
                .headers(headers -> {
                    headers.setBearerAuth(accessToken);
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                })
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        if (response == null) {
            throw new RuntimeException("Failed to get user info from Kakao");
        }

        return new KakaoUserInfo(response);
    }
}
