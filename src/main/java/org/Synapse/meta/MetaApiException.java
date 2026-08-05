package org.Synapse.meta;

/** Raised when the Graph API returns an error, or the app is missing Meta credentials. */
public class MetaApiException extends RuntimeException {
    public MetaApiException(String message) {
        super(message);
    }

    public MetaApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
