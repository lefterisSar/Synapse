package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * A single ad within a campaign. {@code previewShareableLink} is a tokenless URL that renders the
 * ad preview in a new tab; the embeddable per-format preview comes from {@code /api/ads/{id}/preview}.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Ad(
        String id,
        String name,
        String status,
        String adsetId,
        AdCreative creative,
        String previewShareableLink
) {
}
