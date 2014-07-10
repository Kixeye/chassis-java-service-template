package com.kixeye.template.service;

import com.codahale.metrics.Counter;
import com.codahale.metrics.MetricRegistry;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.SettableFuture;
import com.kixeye.chassis.transport.dto.ServiceError;
import com.kixeye.chassis.transport.http.HttpServiceException;
import com.kixeye.chassis.transport.websocket.ActionMapping;
import com.kixeye.chassis.transport.websocket.ActionPayload;
import com.kixeye.chassis.transport.websocket.WebSocketController;
import com.kixeye.chassis.transport.websocket.WebSocketMessageRegistry;
import com.kixeye.template.service.dto.PingMessage;
import com.kixeye.template.service.dto.PongMessage;
import com.wordnik.swagger.annotations.Api;
import com.wordnik.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.async.DeferredResult;
import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.util.concurrent.Future;

/**
 * A service that allows clients to do a ping.
 *
 * @author me
 */
@RestController
@WebSocketController
@Api(value="Ping Service", description = "Demonstrates success and error http endpoints exposed using the chassis-transport library.")
public class PingService {

    @Autowired
    private WebSocketMessageRegistry messageRegistry;

    @Autowired
    private MetricRegistry metricRegistry;

    // Metric counting number of ping requets
    private Counter metricPingCounter;

    /**
     * Initializes the PingMessageHandler.
     */
    @PostConstruct
    public void initialize() {
        // register message types for the serializers
        messageRegistry.registerType("ping", PingMessage.class);
        messageRegistry.registerType("pong", PongMessage.class);

        // create metric counting number of ping requests
        metricPingCounter = metricRegistry.counter("ping.counter");
    }

    /**
     * Demonstrates how exception handling works for unexpected errors.
     */
    @ApiOperation(value="Throws an unexpected error.", position = 2)
    @ActionMapping("unexpectedError")
    @RequestMapping(method = RequestMethod.GET, value = "/unexpectedError")
    public void unexpectedError() {
        throw new RuntimeException("Unexpected error!");
    }

    /**
     * Demonstrates how exception handling works for expected/validation errors.
     */
    @ApiOperation(value="Throws an expected error.", position = 1)
    @ActionMapping("expectedError")
    @RequestMapping(method = RequestMethod.GET, value = "/expectedError")
    public void expectedError() {
        throw new HttpServiceException(new ServiceError("Expected error!", "This is an example of an expected error - such as a validation error!"), HttpServletResponse.SC_BAD_REQUEST);
    }

    /**
     * Returns the string "pong".
     *
     * @param ping the ping message
     * @return the pong message
     */
    @ApiOperation(value="Returns a pong message with the message in the ping.", position = 0)
    @ActionMapping("ping")
    @RequestMapping(method = RequestMethod.POST, value = "/ping")
    public PongMessage ping(@RequestBody @ActionPayload @Valid PingMessage ping) {
        metricPingCounter.inc();

        return new PongMessage(ping.getMessage());
    }
}