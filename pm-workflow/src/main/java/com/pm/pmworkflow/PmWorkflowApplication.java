package com.pm.pmworkflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class PmWorkflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(PmWorkflowApplication.class, args);
    }
}
