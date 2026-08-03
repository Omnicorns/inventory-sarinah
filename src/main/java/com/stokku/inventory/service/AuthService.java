package com.stokku.inventory.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.stokku.inventory.model.Role;
import com.stokku.inventory.model.User;
import com.stokku.inventory.repo.UserRepository;
import com.stokku.inventory.security.AuthUser;
import com.stokku.inventory.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final PostLoginPromisService postLoginPromisService;
    private  ObjectMapper objectMapper;

    public AuthService(UserRepository userRepo, PasswordEncoder encoder, JwtService jwtService, PostLoginPromisService postLoginPromisService) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.postLoginPromisService = postLoginPromisService;

    }



    public record LoginRequest(String email, String password) {}
    public record LoginResponse(String token, User user) {}

    @Transactional
    public LoginResponse login(LoginRequest dto) {

        if (dto.email() == null || dto.email().isBlank()
                || dto.password() == null || dto.password().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email/username dan password wajib diisi"
            );
        }

        String loginIdentity = dto.email().trim();

        /*
         * 1. Coba login menggunakan database inventory terlebih dahulu.
         */
        Optional<User> localUserOptional =
                userRepo.findByEmailIgnoreCase(loginIdentity);

        if (localUserOptional.isPresent()) {
            User localUser = localUserOptional.get();

            if (localUser.getPasswordHash() != null
                    && encoder.matches(
                    dto.password(),
                    localUser.getPasswordHash()
            )) {

                return new LoginResponse(
                        jwtService.generate(localUser),
                        localUser
                );
            }
        }

        /*
         * 2. Password lokal tidak cocok atau user belum ada.
         * Coba login ke API Sarinah.
         */
        ObjectNode request = objectMapper.createObjectNode();

        request.put("usernameOrEmail", loginIdentity);
        request.put("password", dto.password());
        request.put("deviceId", "INVENTORY-WEB");

        ObjectNode portalResponse;

        try {
            portalResponse = postLoginPromisService.execute(request);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "API login Sarinah tidak dapat dihubungi",
                    exception
            );
        }

        if (portalResponse == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Response login Sarinah kosong"
            );
        }

        /*
         * 3. Ambil email dan nama dari response API Sarinah.
         */
        String portalEmail = getPortalEmail(portalResponse);

        /*
         * Jika input memang berupa email dan response tidak membawa email,
         * gunakan input login sebagai fallback.
         */
        if ((portalEmail == null || portalEmail.isBlank())
                && loginIdentity.contains("@")) {
            portalEmail = loginIdentity;
        }

        if (portalEmail == null || portalEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Login Sarinah berhasil, tetapi email user tidak ditemukan pada response"
            );
        }

        String portalName = getPortalName(portalResponse);

        if (portalName == null || portalName.isBlank()) {
            portalName = portalEmail;
        }

        String finalEmail = portalEmail.trim().toLowerCase();
        String finalName = portalName.trim();

        /*
         * 4. Cari lagi berdasarkan email dari response Sarinah.
         * Jika belum ada, buat user inventory secara otomatis.
         */
        User user = userRepo.findByEmailIgnoreCase(finalEmail)
                .orElseGet(() -> {
                    User newUser = new User();

                    newUser.setEmail(finalEmail);
                    newUser.setName(finalName);

                    /*
                     * Jangan menyimpan password Sarinah ke inventory.
                     * Gunakan password acak karena autentikasi user ini
                     * dilakukan melalui API Sarinah.
                     */
                    newUser.setPasswordHash(
                            encoder.encode(UUID.randomUUID().toString())
                    );

                    newUser.setRole(Role.STAFF);


                    return userRepo.save(newUser);
                });



        /*
         * 5. Buat JWT milik inventory.
         */
        return new LoginResponse(
                jwtService.generate(user),
                user
        );
    }

    public User me(AuthUser me) {
        return userRepo.findById(me.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User tidak valid"));
    }

    private String getPortalEmail(ObjectNode response) {

        String email = response.path("email").asText(null);

        if (isBlank(email)) {
            email = response.path("user")
                    .path("email")
                    .asText(null);
        }

        if (isBlank(email)) {
            email = response.path("data")
                    .path("email")
                    .asText(null);
        }

        if (isBlank(email)) {
            email = response.path("data")
                    .path("user")
                    .path("email")
                    .asText(null);
        }

        return email;
    }

    private String getPortalName(ObjectNode response) {

        String name = response.path("name").asText(null);

        if (isBlank(name)) {
            name = response.path("fullName").asText(null);
        }

        if (isBlank(name)) {
            name = response.path("user")
                    .path("name")
                    .asText(null);
        }

        if (isBlank(name)) {
            name = response.path("data")
                    .path("name")
                    .asText(null);
        }

        if (isBlank(name)) {
            name = response.path("data")
                    .path("user")
                    .path("name")
                    .asText(null);
        }

        return name;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
