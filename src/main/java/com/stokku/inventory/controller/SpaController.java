package com.stokku.inventory.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object uri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String path = uri == null ? "" : uri.toString();

        // Jangan forward request API atau file statis (yang ada titiknya) ke index.html
        boolean isApi = path.startsWith("/api") || path.contains("/api/");
        boolean isFile = path.contains(".");

        if (status != null && Integer.parseInt(status.toString()) == 404 && !isApi && !isFile) {
            return "forward:/index.html";
        }
        // Selain itu, biarkan error tampil normal (mis. 401/500/404 API)
        return "forward:/index.html"; // untuk SPA, fallback ke index juga aman
    }
}
