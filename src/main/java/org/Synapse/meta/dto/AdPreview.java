package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One row from the Graph API {@code /{ad-id}/previews} edge. {@code body} is a ready-to-embed
 * {@code <iframe>…</iframe>} snippet for the requested ad format.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AdPreview(String body) {
}
