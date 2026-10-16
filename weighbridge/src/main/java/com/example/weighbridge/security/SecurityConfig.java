
package com.example.weighbridge.security;

import java.util.Base64;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    // Password encryption
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // JWT secret key
    @Bean
    public SecretKey jwtKey(
            @Value("${app.jwt.secret}") String encodedSecret) {

        byte[] keyBytes = Base64.getDecoder()
                .decode(encodedSecret);

        if (keyBytes.length < 32) {
            throw new IllegalArgumentException(
                "JWT_SECRET must contain at least 32 random bytes"
            );
        }

        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    // JWT encoder
    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtKey) {
        return NimbusJwtEncoder.withSecretKey(jwtKey)
                .algorithm(MacAlgorithm.HS256)
                .build();
    }

    // JWT decoder
    @Bean
    public JwtDecoder jwtDecoder(
            SecretKey jwtKey,
            @Value("${app.jwt.issuer}") String issuer) {

        NimbusJwtDecoder decoder =
                NimbusJwtDecoder.withSecretKey(jwtKey)
                        .macAlgorithm(MacAlgorithm.HS256)
                        .build();

        decoder.setJwtValidator(
                JwtValidators.createDefaultWithIssuer(issuer)
        );

        return decoder;
    }

    // Main security configuration
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter authenticationConverter =
                new JwtAuthenticationConverter();

        authenticationConverter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter
        );

        return http

            // Enable CORS
            .cors(Customizer.withDefaults())

            // Stateless JWT authentication
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(authorize -> authorize

                // Public React frontend resources
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/assets/**",
                    "/static/**",
                    "/favicon.ico",
                    "/favicon.png",
                    "/manifest.json",
                    "/robots.txt",
                    "/vite.svg"
                ).permitAll()

                // Public login endpoint
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/login"
                ).permitAll()

                // ADMIN APIs
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                // USER APIs
                .requestMatchers("/api/user/**")
                    .hasRole("USER")

                // All other API endpoints require authentication
                .requestMatchers("/api/**")
                    .authenticated()

                // Other routes remain protected by default
                .anyRequest()
                    .authenticated()
            )

            // JWT authentication
            .oauth2ResourceServer(resourceServer ->
                resourceServer.jwt(jwt ->
                    jwt.jwtAuthenticationConverter(
                        authenticationConverter
                    )
                )
            )

            .build();
    }

    // CORS configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.frontend.origin:http://localhost:3000}")
            String frontendOrigin) {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(frontendOrigin)
        );

        configuration.setAllowedMethods(
                List.of(
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                    "Content-Type",
                    "Authorization"
                )
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/api/**",
                configuration
        );

        return source;
    }
}
