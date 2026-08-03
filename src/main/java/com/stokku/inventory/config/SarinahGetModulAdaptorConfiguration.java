package com.stokku.inventory.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.httpcomponents.hc5
        .PoolingHttpClientConnectionManagerMetricsBinder;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.socket.ConnectionSocketFactory;
import org.apache.hc.client5.http.socket.PlainConnectionSocketFactory;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.http.config.RegistryBuilder;
import org.apache.hc.core5.http.io.SocketConfig;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.apache.hc.core5.ssl.TrustStrategy;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import javax.net.ssl.SSLContext;
import java.io.IOException;
import java.util.UUID;

@Configuration
public class SarinahGetModulAdaptorConfiguration {

    @Value("${http.client.max-connections}")
    private int maxTotalConnections;

    @Value("${http.client.max-per-route}")
    private int maxPerRoute;

    @Value("${http.client.connection-request-timeout}")
    private int connectionRequestTimeout;

    @Value("${http.client.connect-timeout}")
    private int connectTimeout;

    @Value("${http.client.read-timeout}")
    private int readTimeout;

    @Value("${sarinah-portal.base-url}")
    private String baseUrl;

    @Value("${sarinah-portal.api-key}")
    private String apiKey;

    /**
     * Menambahkan API key dan correlation ID
     * untuk setiap request ke Sarinah Portal.
     */
    static class DefaultInterceptor implements ClientHttpRequestInterceptor {

        private final String apiKey;

        DefaultInterceptor(String apiKey) {
            this.apiKey = apiKey;
        }

        @Override
        public ClientHttpResponse intercept(
                HttpRequest request,
                byte[] body,
                ClientHttpRequestExecution execution
        ) throws IOException {

            request.getHeaders().set("x-api-key", apiKey);
            request.getHeaders().set(
                    "X-Correlation-ID",
                    UUID.randomUUID().toString()
            );

            return execution.execute(request, body);
        }
    }

    static class AntivirusRetryInterceptor
            implements ClientHttpRequestInterceptor {

        private final int maxExtraAttempts;
        private final long backoffMillis;

        AntivirusRetryInterceptor(
                int maxExtraAttempts,
                long backoffMillis
        ) {
            this.maxExtraAttempts = maxExtraAttempts;
            this.backoffMillis = backoffMillis;
        }

        @Override
        public ClientHttpResponse intercept(
                HttpRequest request,
                byte[] body,
                ClientHttpRequestExecution execution
        ) throws IOException {

            int totalAttempts = 1 + maxExtraAttempts;

            for (int attempt = 1; attempt <= totalAttempts; attempt++) {

                ClientHttpResponse response =
                        execution.execute(request, body);

                if (!isBlockedByAntivirus(response)) {
                    return response;
                }

                if (attempt < totalAttempts) {
                    try {
                        response.close();
                    } catch (Exception ignored) {
                    }

                    try {
                        Thread.sleep(backoffMillis * attempt);
                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();

                        throw new IOException(
                                "Proses retry terinterupsi",
                                exception
                        );
                    }
                } else {
                    return response;
                }
            }

            throw new IOException("Request gagal dijalankan");
        }

        private boolean isBlockedByAntivirus(
                ClientHttpResponse response
        ) throws IOException {
            return response.getStatusCode().value() == 500;
        }
    }

    private HttpComponentsClientHttpRequestFactory getRequestFactory(
            MeterRegistry meterRegistry
    ) throws Exception {

        SSLContext sslContext = SSLContextBuilder.create()
                .loadTrustMaterial(
                        null,
                        (TrustStrategy) (chain, authType) -> true
                )
                .build();

        var socketFactoryRegistry =
                RegistryBuilder.<ConnectionSocketFactory>create()
                        .register(
                                "https",
                                new SSLConnectionSocketFactory(
                                        sslContext,
                                        NoopHostnameVerifier.INSTANCE
                                )
                        )
                        .register(
                                "http",
                                PlainConnectionSocketFactory
                                        .getSocketFactory()
                        )
                        .build();

        PoolingHttpClientConnectionManager connectionManager =
                new PoolingHttpClientConnectionManager(
                        socketFactoryRegistry
                );

        connectionManager.setMaxTotal(maxTotalConnections);
        connectionManager.setDefaultMaxPerRoute(maxPerRoute);

        connectionManager.setDefaultSocketConfig(
                SocketConfig.custom()
                        .setSoTimeout(
                                Timeout.ofMilliseconds(readTimeout)
                        )
                        .build()
        );

        new PoolingHttpClientConnectionManagerMetricsBinder(
                connectionManager,
                "httpClientPool"
        ).bindTo(meterRegistry);

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(
                        Timeout.ofMilliseconds(connectTimeout)
                )
                .setResponseTimeout(
                        Timeout.ofMilliseconds(readTimeout)
                )
                .setConnectionRequestTimeout(
                        Timeout.ofMilliseconds(
                                connectionRequestTimeout
                        )
                )
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .build();

        return new HttpComponentsClientHttpRequestFactory(httpClient);
    }

    @Bean(name = "sarinahPortalRestClient")
    public RestClient sarinahPortalRestClient(
            RestClient.Builder builder,
            MeterRegistry meterRegistry
    ) throws Exception {

        HttpComponentsClientHttpRequestFactory factory =
                getRequestFactory(meterRegistry);

        return builder
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(
                        HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_JSON_VALUE
                )

                // Harus dipanggil terpisah, bukan dalam satu method
                .requestInterceptor(
                        new DefaultInterceptor(apiKey)
                )
                .requestInterceptor(
                        new AntivirusRetryInterceptor(1, 300)
                )
                .build();
    }
}