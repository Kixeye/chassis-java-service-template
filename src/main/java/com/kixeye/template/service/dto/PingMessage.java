package com.kixeye.template.service.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * A simple ping message.
 *
 * @author ebahtijaragic
 */
public class PingMessage {

    private final String _message;

    @JsonCreator
    public PingMessage(@JsonProperty(value = "message", required = true) String msgArg) {
        this._message = msgArg;
    }

    @JsonProperty("message")
    public String getMessage() {
        return _message;
    }
}
