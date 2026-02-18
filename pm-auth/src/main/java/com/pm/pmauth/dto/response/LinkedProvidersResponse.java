package com.pm.pmauth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LinkedProvidersResponse {

    private List<String> providers;

    public static LinkedProvidersResponse of(List<String> providers) {
        return new LinkedProvidersResponse(providers);
    }
}
