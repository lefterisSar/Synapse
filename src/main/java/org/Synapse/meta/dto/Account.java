package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * Basic ad-account metadata. {@code currency} drives money formatting in the dashboard;
 * {@code accountStatus} is Meta's numeric status (1 = active).
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Account(
        String id,
        String name,
        String currency,
        Integer accountStatus,
        String amountSpent,
        String timezoneName
) {
}
