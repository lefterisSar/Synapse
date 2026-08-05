package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * A row of performance metrics. Graph API returns every metric as a string, so we keep
 * them as strings here and let the frontend format them. When queried at account level
 * the campaign fields are null; at {@code level=campaign} they are populated.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Insight(
        String impressions,
        String clicks,
        String spend,
        String cpc,
        String cpm,
        String ctr,
        String reach,
        String campaignId,
        String campaignName,
        String dateStart,
        String dateStop
) {
}
