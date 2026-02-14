package com.dy.dyauth.oauth2.client;

import com.dy.dyauth.oauth2.OAuth2Properties;
import com.dy.dyauth.oauth2.OAuth2Provider;
import com.dy.dyauth.oauth2.userinfo.GoogleUserInfo;
import com.dy.dyauth.oauth2.userinfo.OAuth2UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleOAuth2Client implements OAuth2Client {

    private final OAuth2Properties oAuth2Properties;
    private final RestTemplate restTemplate;

    @Override
    public OAuth2Provider getProvider() {
        return OAuth2Provider.GOOGLE;
    }

    @Override
    public String generateAuthorizationUrl(String state) {
        OAuth2Properties.ProviderConfig config = oAuth2Properties.getProvider(OAuth2Provider.GOOGLE);

        String scope = String.join(" ", config.getScope());

        return config.getAuthorizationUri() +
                "?client_id=" + config.getClientId() +
                "&redirect_uri=" + URLEncoder.encode(config.getRedirectUri(), StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8) +
                "&state=" + state +
                "&access_type=offline" +
                "&prompt=consent";
    }

    @Override
    public String getAccessToken(String code) {
        OAuth2Properties.ProviderConfig config = oAuth2Properties.getProvider(OAuth2Provider.GOOGLE);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", config.getClientId());
        params.add("client_secret", config.getClientSecret());
        params.add("redirect_uri", config.getRedirectUri());
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                config.getTokenUri(),
                HttpMethod.POST,
                request,
                new ParameterizedTypeReference<>() {}
        );

        Map<String, Object> body = response.getBody();
        if (body == null || !body.containsKey("access_token")) {
            throw new RuntimeException("Failed to get access token from Google");
        }

        return (String) body.get("access_token");
    }

    @Override
    public OAuth2UserInfo getUserInfo(String accessToken) {
        OAuth2Properties.ProviderConfig config = oAuth2Properties.getProvider(OAuth2Provider.GOOGLE);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                config.getUserInfoUri(),
                HttpMethod.GET,
                request,
                new ParameterizedTypeReference<>() {}
        );

        Map<String, Object> body = response.getBody();
        if (body == null) {
            throw new RuntimeException("Failed to get user info from Google");
        }

        return new GoogleUserInfo(body);
    }
}
