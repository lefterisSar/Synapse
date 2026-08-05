package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/** The creative behind an ad. {@code thumbnailUrl} is a tokenless CDN image safe to show directly. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public record AdCreative(
        String id,
        String name,
        String title,
        String body,
        String thumbnailUrl,
        String objectType
) {
}
