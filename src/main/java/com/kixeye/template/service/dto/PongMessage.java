package com.kixeye.template.service.dto;

import com.wordnik.swagger.annotations.ApiModelProperty;

/**
 * A simple pong message.
 *
 * @author ebahtijaragic
 */
public class PongMessage {
    @ApiModelProperty(required = true)
    public String message;

    public PongMessage() {

    }

    public PongMessage(String message) {
        this.message = message;
    }
}
