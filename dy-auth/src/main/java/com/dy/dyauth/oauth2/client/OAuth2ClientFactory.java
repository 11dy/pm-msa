package com.dy.dyauth.oauth2.client;

import com.dy.dyauth.oauth2.OAuth2Provider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OAuth2ClientFactory {

    private final Map<OAuth2Provider, OAuth2Client> clients;

    public OAuth2ClientFactory(List<OAuth2Client> clientList) {
        this.clients = clientList.stream()
                .collect(Collectors.toMap(OAuth2Client::getProvider, Function.identity()));
    }

    public OAuth2Client getClient(OAuth2Provider provider) {
        OAuth2Client client = clients.get(provider);
        if (client == null) {
            throw new IllegalArgumentException("Unsupported OAuth2 provider: " + provider);
        }
        return client;
    }

    public OAuth2Client getClient(String providerName) {
        return getClient(OAuth2Provider.fromString(providerName));
    }
}
