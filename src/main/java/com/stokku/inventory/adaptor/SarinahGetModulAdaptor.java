package com.stokku.inventory.adaptor;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.stokku.inventory.util.CommonUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@RequiredArgsConstructor
@Component
public class SarinahGetModulAdaptor {
    private final CommonUtils commonUtils;
    private final RestClient defaultPointRestClient;


    @Value("${sarinah-portal.base-url}")
    private String loginUrl;


    public ObjectNode loginSarinah(ObjectNode request) {

        return defaultPointRestClient
                .post()
                .uri(loginUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(ObjectNode.class);
    }

}
