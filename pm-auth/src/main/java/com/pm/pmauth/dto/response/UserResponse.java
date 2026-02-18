package com.pm.pmauth.dto.response;

import com.pm.pmauth.domain.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String userNm;
    private String role;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .userNm(user.getUserNm())
                .role(user.getRole())
                .build();
    }
}
