package com.pm.pmauth.oauth2;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties(prefix = "oauth2")
public class OAuth2Properties {

    private Map<String, ProviderConfig> providers = new HashMap<>();

    @Getter
    @Setter
    public static class ProviderConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
        private String authorizationUri;
        private String tokenUri;
        private String userInfoUri;
        private List<String> scope;
    }

    public ProviderConfig getProvider(String name) {
        return providers.get(name.toLowerCase());
    }

    public ProviderConfig getProvider(OAuth2Provider provider) {
        return providers.get(provider.getRegistrationId());
    }
}
