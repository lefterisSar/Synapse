package org.Synapse.meta.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Envelope Graph API list endpoints return: {@code { "data": [...], "paging": {...} }}. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GraphListResponse<T>(List<T> data, Paging paging) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Paging(Cursors cursors, String next, String previous) {

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Cursors(String before, String after) {
        }
    }
}
