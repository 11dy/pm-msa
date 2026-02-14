package com.dy.dyauth.config;

import com.dy.dyauth.oauth2.OAuth2Properties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(OAuth2Properties.class)
public class OAuth2Config {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
