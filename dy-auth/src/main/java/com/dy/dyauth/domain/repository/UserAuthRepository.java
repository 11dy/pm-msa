package com.dy.dyauth.domain.repository;

import com.dy.dyauth.domain.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuth, Long> {

    @Query("SELECT ua FROM UserAuth ua JOIN FETCH ua.user WHERE ua.user.email = :email AND ua.provider = 'LOCAL'")
    Optional<UserAuth> findLocalAuthByEmail(@Param("email") String email);

    @Query("SELECT ua FROM UserAuth ua JOIN FETCH ua.user WHERE ua.provider = :provider AND ua.providerId = :providerId")
    Optional<UserAuth> findByProviderAndProviderId(@Param("provider") String provider, @Param("providerId") String providerId);

    boolean existsByUserIdAndProvider(Long userId, String provider);

    List<UserAuth> findAllByUserId(Long userId);
}
