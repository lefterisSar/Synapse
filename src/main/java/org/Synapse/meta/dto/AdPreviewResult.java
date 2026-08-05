package org.Synapse.meta.dto;

/** App-facing preview response: which format was rendered, and the embeddable iframe HTML. */
public record AdPreviewResult(String adFormat, String body) {
}
