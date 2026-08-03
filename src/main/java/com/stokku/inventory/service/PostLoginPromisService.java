package com.stokku.inventory.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.stokku.inventory.adaptor.SarinahGetModulAdaptor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostLoginPromisService {
    private final SarinahGetModulAdaptor sarinahGetModulAdaptor;

    public ObjectNode execute(ObjectNode request) {
        return sarinahGetModulAdaptor.loginSarinah(request);

    }
}
