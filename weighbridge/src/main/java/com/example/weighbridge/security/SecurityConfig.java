
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
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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
@EnableMethodSecurity
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

    // JWT role converter
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter
        );

        return converter;
    }

    // Main security configuration
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter)
            throws Exception {

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

                        // Public frontend resources
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

                        // Public ADMIN and USER login
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/login"
                        ).permitAll()

                        // Public desktop synchronization login
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/sync/auth/login"
                        ).permitAll()

                        // Desktop synchronization APIs
                        // Only DESKTOP_SYNC tokens can access these routes
                        .requestMatchers(
                                "/api/sync/**"
                        ).hasRole("DESKTOP_SYNC")

                        // Global Masters - ADMIN and USER read access
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/units",
                                "/api/product-types",
                                "/api/products"
                        ).hasAnyRole("ADMIN", "USER")

                        // Weighment viewing APIs
                        // Site ownership is also checked in the controller
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/user/weighments/**"
                        ).hasRole("USER")

                        // ADMIN APIs
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // Party Master APIs - ADMIN and USER
                        .requestMatchers(
                                "/api/user/parties",
                                "/api/user/parties/**"
                        ).hasAnyRole("ADMIN", "USER")

                        // Other USER APIs
                        .requestMatchers(
                                "/api/user/**"
                        ).hasRole("USER")

                        // Other API endpoints require authentication
                        .requestMatchers(
                                "/api/**"
                        ).authenticated()

                        // Protect remaining routes
                        .anyRequest()
                        .authenticated()
                )

                // JWT authentication
                .oauth2ResourceServer(resourceServer ->
                        resourceServer.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(
                                        jwtAuthenticationConverter
                                )
                        )
                )

                .build();
    }

    // React frontend CORS configuration
    @Bean
        public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:3000",
                        "http://127.0.0.1:3000",
                        "http://192.168.1.3:3000"
                )
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
