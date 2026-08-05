package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * A single ad campaign. Budgets are returned by Graph API as strings in the account's
 * minor currency unit (e.g. "5000" = 50.00 in the account currency).
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public record Campaign(
        String id,
        String name,
        String status,
        String objective,
        String dailyBudget,
        String lifetimeBudget
) {
}
