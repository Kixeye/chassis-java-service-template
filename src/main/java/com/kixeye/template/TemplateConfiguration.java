package com.kixeye.template;

import com.kixeye.chassis.bootstrap.annotation.Destroy;
import com.kixeye.chassis.bootstrap.annotation.Init;
import com.kixeye.chassis.bootstrap.annotation.SpringApp;
import com.kixeye.chassis.support.ChassisConfiguration;
import com.kixeye.chassis.transport.TransportConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * A template configuration.
 *
 * @author ebahtijaragic
 */
@SpringApp(name = "JavaTemplateService",
        propertiesResourceLocation = "classpath:/template-defaults.properties",
        configurationClasses = {
                TransportConfiguration.class,
                ChassisConfiguration.class,
                TemplateConfiguration.class},
        webapp = true)
@Configuration
@ComponentScan(basePackageClasses = TemplateConfiguration.class)
public class TemplateConfiguration {

    @Init
    public static void initialize(org.apache.commons.configuration.Configuration configuration) {
        // Add some initialization code here!
    }

    @Destroy
    public static void destroy() {
        // Add some destruction code here!
    }
}
