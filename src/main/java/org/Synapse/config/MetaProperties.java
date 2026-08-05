package org.Synapse.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the Meta Marketing (Graph) API, bound from the `meta.*` keys
 * in application.yml (which in turn read the META_* environment variables).
 */
@ConfigurationProperties(prefix = "meta")
public record MetaProperties(
        String apiVersion,
        String accessToken,
        String adAccountId
) {

    /** True when both required secrets are present, so callers can fail fast with a clear message. */
    public boolean isConfigured() {
        return accessToken != null && !accessToken.isBlank()
                && adAccountId != null && !adAccountId.isBlank();
    }

    /** Normalizes the ad account id to the `act_<id>` form the Graph API expects. */
    public String normalizedAdAccountId() {
        if (adAccountId == null || adAccountId.isBlank()) {
            return adAccountId;
        }
        return adAccountId.startsWith("act_") ? adAccountId : "act_" + adAccountId;
    }
}
