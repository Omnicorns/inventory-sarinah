package com.stokku.inventory.service;

import com.stokku.inventory.model.User;
import com.stokku.inventory.repo.UserRepository;
import com.stokku.inventory.security.AuthUser;
import com.stokku.inventory.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service

public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepo, PasswordEncoder encoder, JwtService jwtService) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    public record LoginRequest(String email, String password) {}
    public record LoginResponse(String token, User user) {}

    public LoginResponse login(LoginRequest dto) {
        User user = userRepo.findByEmail(dto.email() == null ? "" : dto.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email atau password salah"));
        if (!encoder.matches(dto.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email atau password salah");
        return new LoginResponse(jwtService.generate(user), user);
    }

    public User me(AuthUser me) {
        return userRepo.findById(me.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User tidak valid"));
    }
}
