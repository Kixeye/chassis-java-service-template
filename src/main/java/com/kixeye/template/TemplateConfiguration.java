package com.kixeye.template;

import com.kixeye.chassis.bootstrap.annotation.App;
import com.kixeye.chassis.bootstrap.annotation.Destroy;
import com.kixeye.chassis.bootstrap.annotation.Init;
import com.kixeye.chassis.bootstrap.configuration.ConfigurationProvider;
import com.kixeye.chassis.support.ChassisConfiguration;
import com.kixeye.chassis.transport.TransportConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

/**
 * A template configuration.
 *
 * @author ebahtijaragic
 */
@App(name = "JavaTemplateService",
        propertiesResourceLocation = "classpath:/template-defaults.properties",
        configurationClasses = {
                TransportConfiguration.class,
                ChassisConfiguration.class,
                TemplateConfiguration.class},
        webapp = true)
@Configuration
@ComponentScan(basePackageClasses = TemplateConfiguration.class)
public class TemplateConfiguration {

    /*
     * use this method to perform any initialization required by the application prior to application startup. You
     * can optionally get a reference to the ConfigurationProvider
     */
    @Init
    public static void init(org.apache.commons.configuration.Configuration configuration/*, com.kixeye.chassis.bootstrap.configuration.ConfigurationProvider*/) {
    }

    /*
     * use this method to perform any teardown required after the application is stopped
     */
    @Destroy
    public static void destroy() {
    }

    /*
     * use this method to perform any tasks that need to be done after initial application startup
     */
    @PostConstruct
    public void postConstruct() {
    }

    /*
     * use this method to perform any tasks taht need to be done just before the application stops
     */
    @PreDestroy
    public void preDestroy() {
    }
}
