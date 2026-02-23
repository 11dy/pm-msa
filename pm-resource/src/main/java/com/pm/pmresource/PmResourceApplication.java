package com.pm.pmresource;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class PmResourceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PmResourceApplication.class, args);
    }
}
