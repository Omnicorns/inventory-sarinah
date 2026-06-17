package com.stokku.inventory.controller;

import com.stokku.inventory.model.User;
import com.stokku.inventory.security.AuthUser;
import com.stokku.inventory.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthService.LoginResponse login(@Valid @RequestBody AuthService.LoginRequest body) {
        return authService.login(body);
    }

    @GetMapping("/me")
    public User me(@AuthenticationPrincipal AuthUser me) {
        return authService.me(me);
    }
}
