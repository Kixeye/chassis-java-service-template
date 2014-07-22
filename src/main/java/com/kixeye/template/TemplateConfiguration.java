package com.kixeye.template;

import com.kixeye.chassis.bootstrap.BootstrapException.ApplicationConfigurationNotFoundException;
import com.kixeye.chassis.bootstrap.annotation.App;
import com.kixeye.chassis.bootstrap.annotation.SpringApp;
import com.kixeye.chassis.bootstrap.aws.ServerInstanceContext;
import com.kixeye.chassis.bootstrap.configuration.ConfigurationProvider;
import com.kixeye.chassis.bootstrap.configuration.zookeeper.ZookeeperConfigurationProvider;
import com.kixeye.chassis.support.ChassisConfiguration;
import com.kixeye.chassis.transport.TransportConfiguration;
import com.netflix.config.ConcurrentMapConfiguration;
import org.apache.commons.configuration.AbstractConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;

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

    @PostConstruct
    public void init() {
        System.out.println();
        // Add some initialization logic here!!
    }

    @PreDestroy
    public void destroy() {
        System.out.println();
        // Add some destruction code here!
    }
}
