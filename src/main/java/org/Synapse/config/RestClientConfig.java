package org.Synapse.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds the {@link RestClient} used to talk to the Graph API. The base URL pins the
 * API version and the token is attached once as a Bearer header (keeping it out of
 * request URLs / logs).
 */
@Configuration
public class RestClientConfig {

    @Bean
    RestClient metaRestClient(MetaProperties props) {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("https://graph.facebook.com/" + props.apiVersion())
                // Graph API returns JSON but labels the Content-Type as `text/javascript`,
                // which the default Jackson converter rejects. Teach it to accept that too.
                .messageConverters(converters -> converters.stream()
                        .filter(MappingJackson2HttpMessageConverter.class::isInstance)
                        .map(MappingJackson2HttpMessageConverter.class::cast)
                        .forEach(jackson -> {
                            List<MediaType> types = new ArrayList<>(jackson.getSupportedMediaTypes());
                            types.add(MediaType.valueOf("text/javascript"));
                            jackson.setSupportedMediaTypes(types);
                        }));
        if (props.accessToken() != null && !props.accessToken().isBlank()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + props.accessToken());
        }
        return builder.build();
    }
}
