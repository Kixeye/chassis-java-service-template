package com.kixeye.core.template.test;

import com.dyuproject.protostuff.LinkedBuffer;
import com.dyuproject.protostuff.ProtobufIOUtil;
import com.dyuproject.protostuff.Schema;
import com.dyuproject.protostuff.runtime.RuntimeSchema;
import com.kixeye.chassis.support.ChassisConfiguration;
import com.kixeye.chassis.transport.TransportConfiguration;
import com.kixeye.chassis.transport.dto.Envelope;
import com.kixeye.chassis.transport.websocket.WebSocketMessageRegistry;
import com.kixeye.template.TemplateConfiguration;
import com.kixeye.template.service.dto.PingMessage;
import com.kixeye.template.service.dto.PongMessage;
import org.apache.commons.lang.RandomStringUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketListener;
import org.eclipse.jetty.websocket.client.WebSocketClient;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.util.SocketUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * A template test for the services.
 *
 * @author ebahtijaragic
 */
public class TemplateTest {
    private AnnotationConfigWebApplicationContext context;

    private int httpPort = -1;
    private int webSocketPort = -1;

    @Before
    public void setup() {
        httpPort = SocketUtils.findAvailableTcpPort();
        webSocketPort = SocketUtils.findAvailableTcpPort();

        // set properties for test
        Map<String, Object> properties = new HashMap<>();
        properties.put("chassis.eureka.disable", true);
        properties.put("eureka.datacenter", "local");

        properties.put("app.environment", "local");
        properties.put("app.name", TemplateTest.class.getSimpleName());
        properties.put("app.version", "" + System.currentTimeMillis());

        properties.put("http.enabled", true);
        properties.put("http.hostname", "localhost");
        properties.put("http.port", httpPort);
        properties.put("http.metrics.threadpool.enabled", false);
        properties.put("http.metrics.handler.enabled", false);

        properties.put("websocket.enabled", true);
        properties.put("websocket.hostname", "localhost");
        properties.put("websocket.port", webSocketPort);
        properties.put("websocket.metrics.threadpool.enabled", false);
        properties.put("websocket.metrics.handler.enabled", false);

        properties.put("metrics.graphite.enabled", false);
        properties.put("metrics.aws.enabled", false);
        properties.put("metrics.aws.filter", "");
        properties.put("metrics.aws.publish-interval", 1);
        properties.put("metrics.aws.publish-interval-unit", "");
        properties.put("metrics.aws.region", "default");
        properties.put("aws.accessId", "");
        properties.put("aws.secretKey", "");
        properties.put("aws.instance.id", "");

        // shove properties into Spring Environment
        context = new AnnotationConfigWebApplicationContext();
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("default", properties));
        context.setEnvironment(environment);

        // start spring
        context.register(PropertySourcesPlaceholderConfigurer.class);
        context.register(TemplateConfiguration.class);
        context.register(TransportConfiguration.class);
        context.register(ChassisConfiguration.class);
        context.refresh();
    }

    @After
    public void tearDown() {
        context.close();
    }

    @Test
    public void testHttpPing() throws Exception {
        final String randomString = RandomStringUtils.randomAlphanumeric(16);

        RestTemplate client = new RestTemplate();

        PongMessage response = client.postForObject(new URI("http://localhost:" + httpPort + "/ping"), new PingMessage(randomString), PongMessage.class);

        Assert.assertNotNull(response);
        Assert.assertEquals(randomString, response.message);
    }

    @Test
    public void testWebSocketPing() throws Exception {
        final String randomString = RandomStringUtils.randomAlphanumeric(16);

        WebSocketClient wsClient = new WebSocketClient();

        try {
            wsClient.start();

            final WebSocketMessageRegistry messageRegistry = context.getBean(WebSocketMessageRegistry.class);

            final LinkedBlockingQueue<Object> queue = new LinkedBlockingQueue<>();

            WebSocketListener webSocket = new WebSocketListener() {
                @SuppressWarnings({"rawtypes", "unchecked"})
                public void onWebSocketBinary(byte[] payload, int offset, int length) {
                    try {
                        Schema<Envelope> envelopeSchema = RuntimeSchema.getSchema(Envelope.class);

                        final Envelope envelope = envelopeSchema.newMessage();

                        ProtobufIOUtil.mergeFrom(payload, offset, length, envelope, envelopeSchema);

                        Object message = null;

                        if (StringUtils.isNotBlank(envelope.typeId)) {
                            Class<?> messageClass = messageRegistry.getClassByTypeId(envelope.typeId);

                            if (messageClass == null) {
                                throw new RuntimeException("Unknown type id: " + envelope.typeId);
                            }

                            Schema messageSchema = RuntimeSchema.getSchema(messageClass);

                            message = messageSchema.newMessage();

                            ProtobufIOUtil.mergeFrom(envelope.payload.array(), message, messageSchema);
                        }

                        queue.offer(message);
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }

                public void onWebSocketClose(int statusCode, String reason) {
                }

                public void onWebSocketConnect(Session session) {
                }

                public void onWebSocketError(Throwable cause) {
                }

                public void onWebSocketText(String message) {
                }
            };


            Schema<Envelope> envelopeSchema = RuntimeSchema.getSchema(Envelope.class);
            Schema<PingMessage> pingSchema = RuntimeSchema.getSchema(PingMessage.class);

            Session session = wsClient.connect(webSocket, new URI("ws://localhost:" + webSocketPort + "/protobuf")).get(5000, TimeUnit.MILLISECONDS);

            LinkedBuffer linkedBuffer = LinkedBuffer.allocate(256);
            Envelope envelope = new Envelope("ping", "ping", null, ByteBuffer.wrap(ProtobufIOUtil.toByteArray(new PingMessage(randomString), pingSchema, linkedBuffer)));
            linkedBuffer.clear();
            byte[] rawEnvelope = ProtobufIOUtil.toByteArray(envelope, envelopeSchema, linkedBuffer);
            linkedBuffer.clear();

            session.getRemote().sendBytes(ByteBuffer.wrap(rawEnvelope));

            PongMessage response = (PongMessage) queue.poll(5, TimeUnit.SECONDS);

            Assert.assertNotNull(response);
            Assert.assertEquals(randomString, response.message);
        } finally {
            wsClient.stop();
        }
    }
}
