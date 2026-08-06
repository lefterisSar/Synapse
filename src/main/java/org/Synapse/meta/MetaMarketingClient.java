package org.Synapse.meta;

import com.fasterxml.jackson.databind.JsonNode;
import org.Synapse.config.MetaProperties;
import org.Synapse.meta.dto.Account;
import org.Synapse.meta.dto.Ad;
import org.Synapse.meta.dto.AdCreative;
import org.Synapse.meta.dto.AdPreview;
import org.Synapse.meta.dto.Campaign;
import org.Synapse.meta.dto.GraphListResponse;
import org.Synapse.meta.dto.Insight;

import java.net.URI;
import java.util.List;
import java.util.Map;
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
    private static final ParameterizedTypeReference<GraphListResponse<Ad>> AD_LIST =
            new ParameterizedTypeReference<>() {
            };
    private static final ParameterizedTypeReference<GraphListResponse<AdPreview>> PREVIEW_LIST =
            new ParameterizedTypeReference<>() {
            };
    private static final String AD_FIELDS =
            "id,name,status,adset_id,preview_shareable_link,"
                    + "creative{id,name,title,body,thumbnail_url,object_type}";

    private final RestClient restClient;
    private final MetaProperties props;
    // Plain client (no Graph base URL, no auth header) for fetching CDN images server-side.
    private final RestClient plainClient = RestClient.create();

    public MetaMarketingClient(RestClient metaRestClient, MetaProperties props) {
        this.restClient = metaRestClient;
        this.props = props;
    }

    /** Fetches account metadata (name, currency, status) used for headers and money formatting. */
    public Account getAccount() {
        requireConfigured();
        return execute(() -> restClient.get()
                .uri(uri -> uri.path("/{account}")
                        .queryParam("fields", "name,currency,account_status,amount_spent,timezone_name")
                        .build(props.normalizedAdAccountId()))
                .retrieve()
                .body(Account.class));
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

    /** Lists the ads under a campaign, expanding the creative (thumbnail, title, body). */
    public GraphListResponse<Ad> getAdsForCampaign(String campaignId) {
        requireConfigured();
        // `fields` is passed as a URI *variable* (not inline) so its `creative{…}` braces aren't
        // mistaken for URI template placeholders — they get percent-encoded as a literal value.
        return execute(() -> restClient.get()
                .uri(uri -> uri.path("/{campaignId}/ads")
                        .queryParam("fields", "{fields}")
                        .queryParam("limit", 100)
                        .build(Map.of("campaignId", campaignId, "fields", AD_FIELDS)))
                .retrieve()
                .body(AD_LIST));
    }

    /**
     * Renders an existing ad in the given format (e.g. {@code DESKTOP_FEED_STANDARD}) and returns
     * the embeddable {@code <iframe>} HTML, or null if Meta produced no preview.
     */
    public String getAdPreview(String adId, String adFormat) {
        requireConfigured();
        GraphListResponse<AdPreview> response = execute(() -> restClient.get()
                .uri(uri -> uri.path("/{adId}/previews")
                        .queryParam("ad_format", adFormat)
                        .build(adId))
                .retrieve()
                .body(PREVIEW_LIST));
        List<AdPreview> rows = response == null ? null : response.data();
        return rows == null || rows.isEmpty() ? null : rows.getFirst().body();
    }

    /**
     * Best available image URL for an ad: the backing post's full-resolution {@code full_picture}
     * when the token has Page access, else the small creative {@code thumbnail_url}. Null if neither.
     */
    public String getAdImageUrl(String adId) {
        requireConfigured();
        Ad ad = execute(() -> restClient.get()
                .uri(uri -> uri.path("/{adId}")
                        .queryParam("fields", "{fields}")
                        .build(Map.of("adId", adId,
                                "fields", "creative{thumbnail_url,effective_object_story_id}")))
                .retrieve()
                .body(Ad.class));
        AdCreative creative = ad != null ? ad.creative() : null;
        if (creative == null) {
            return null;
        }
        String storyId = creative.effectiveObjectStoryId();
        if (storyId != null && !storyId.isBlank()) {
            String fullPicture = tryFetchFullPicture(storyId);
            if (fullPicture != null && !fullPicture.isBlank()) {
                return fullPicture;
            }
        }
        return creative.thumbnailUrl();
    }

    /** The post's full-resolution image, or null if the token lacks Page access (no `pages_read_engagement`). */
    private String tryFetchFullPicture(String storyId) {
        try {
            JsonNode node = restClient.get()
                    .uri(uri -> uri.path("/{storyId}").queryParam("fields", "full_picture").build(storyId))
                    .retrieve()
                    .body(JsonNode.class);
            return node != null && node.hasNonNull("full_picture") ? node.get("full_picture").asText() : null;
        } catch (RestClientException e) {
            return null;
        }
    }

    /**
     * Downloads an image from Meta's CDN server-side so the browser can load it same-origin
     * (dodging ad blockers / tracking protection that block fbcdn). Host-checked to avoid SSRF.
     */
    public byte[] fetchImage(String absoluteUrl) {
        URI uri = URI.create(absoluteUrl);
        String host = uri.getHost();
        if (host == null || !(host.endsWith("fbcdn.net") || host.endsWith("facebook.com"))) {
            throw new MetaApiException("Refusing to fetch image from untrusted host: " + host);
        }
        try {
            return plainClient.get().uri(uri).retrieve().body(byte[].class);
        } catch (RestClientException e) {
            throw new MetaApiException("Failed to fetch thumbnail image: " + e.getMessage(), e);
        }
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
