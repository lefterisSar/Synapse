package org.Synapse.meta;

import com.fasterxml.jackson.databind.JsonNode;
import org.Synapse.config.MetaProperties;
import org.Synapse.meta.dto.Campaign;
import org.Synapse.meta.dto.GraphListResponse;
import org.Synapse.meta.dto.Insight;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.function.Supplier;

/**
 * Thin wrapper over the Graph API Marketing endpoints we read from. Every call is scoped
 * to the configured ad account and requires only the `ads_read` permission.
 */
@Component
public class MetaMarketingClient {

    private static final ParameterizedTypeReference<GraphListResponse<Campaign>> CAMPAIGN_LIST =
            new ParameterizedTypeReference<>() {
            };
    private static final ParameterizedTypeReference<GraphListResponse<Insight>> INSIGHT_LIST =
            new ParameterizedTypeReference<>() {
            };

    private final RestClient restClient;
    private final MetaProperties props;

    public MetaMarketingClient(RestClient metaRestClient, MetaProperties props) {
        this.restClient = metaRestClient;
        this.props = props;
    }

    /** Lists campaigns in the ad account with their status, objective, and budgets. */
    public GraphListResponse<Campaign> getCampaigns() {
        requireConfigured();
        return execute(() -> restClient.get()
                .uri(uri -> uri.path("/{account}/campaigns")
                        .queryParam("fields", "id,name,status,objective,daily_budget,lifetime_budget")
                        .queryParam("limit", 200)
                        .build(props.normalizedAdAccountId()))
                .retrieve()
                .body(CAMPAIGN_LIST));
    }

    /**
     * Account-level performance for the given preset (e.g. {@code last_7d}, {@code last_30d}).
     * Returns a single aggregate row.
     */
    public GraphListResponse<Insight> getAccountInsights(String datePreset) {
        requireConfigured();
        return execute(() -> restClient.get()
                .uri(uri -> uri.path("/{account}/insights")
                        .queryParam("fields", "impressions,clicks,spend,cpc,cpm,ctr,reach")
                        .queryParam("date_preset", datePreset)
                        .build(props.normalizedAdAccountId()))
                .retrieve()
                .body(INSIGHT_LIST));
    }

    /** Same metrics as {@link #getAccountInsights} but broken down one row per campaign. */
    public GraphListResponse<Insight> getInsightsByCampaign(String datePreset) {
        requireConfigured();
        return execute(() -> restClient.get()
                .uri(uri -> uri.path("/{account}/insights")
                        .queryParam("fields",
                                "campaign_id,campaign_name,impressions,clicks,spend,cpc,cpm,ctr,reach")
                        .queryParam("level", "campaign")
                        .queryParam("date_preset", datePreset)
                        .queryParam("limit", 200)
                        .build(props.normalizedAdAccountId()))
                .retrieve()
                .body(INSIGHT_LIST));
    }

    private void requireConfigured() {
        if (!props.isConfigured()) {
            throw new MetaApiException(
                    "Meta API is not configured. Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID.");
        }
    }

    /**
     * Runs a Graph API call, translating its error responses into a {@link MetaApiException}
     * carrying the human-readable message Meta returns
     * (e.g. {@code {"error":{"message":"...","type":"OAuthException","code":190}}}).
     */
    private <T> T execute(Supplier<T> call) {
        try {
            return call.get();
        } catch (RestClientResponseException e) {
            // Graph API replied with a 4xx/5xx and an error body — surface Meta's message.
            throw new MetaApiException("Meta Graph API error: " + extractMessage(e), e);
        } catch (RestClientException e) {
            // Transport / deserialization problem (timeout, unexpected body, etc.).
            throw new MetaApiException("Failed to call the Meta Graph API: " + e.getMessage(), e);
        }
    }

    private String extractMessage(RestClientResponseException e) {
        try {
            JsonNode body = e.getResponseBodyAs(JsonNode.class);
            if (body != null && body.has("error")) {
                return body.path("error").path("message").asText("Unknown Graph API error");
            }
        } catch (Exception ignored) {
            // Body wasn't JSON we could parse; fall back to the status text below.
        }
        return e.getStatusText();
    }
}
