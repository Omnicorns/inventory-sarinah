package com.stokku.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();

        c.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8042",
                "http://127.0.0.1:8042",
                "https://satudata.sarinah.com"
        ));

        c.setAllowedMethods(List.of(
                "GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"
        ));

        // FIX: jangan hanya Authorization dan Content-Type
        c.setAllowedHeaders(List.of("*"));

        c.setExposedHeaders(List.of("Authorization"));
        c.setAllowCredentials(true);
        c.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);

        return src;
    }
}