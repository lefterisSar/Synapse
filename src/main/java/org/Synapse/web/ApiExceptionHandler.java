package org.Synapse.web;

import org.Synapse.meta.MetaApiException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/** Turns Meta/Graph failures into a clean JSON error the frontend can render. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MetaApiException.class)
    public ResponseEntity<Map<String, String>> handleMetaApi(MetaApiException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }
}
