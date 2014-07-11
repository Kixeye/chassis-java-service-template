#! /bin/bash
# ${pom.artifactId} install script.
###

# Functions
function add_application_user() {
	echo Adding user...
	/usr/sbin/groupadd application
	/usr/sbin/useradd -g application application
	echo Done.
}

function create_log_folders() {
	echo Creating log folders...
	mkdir -p /var/log/application/${pom.artifactId}
	/bin/chown -R application:application /var/log/application/${pom.artifactId}
	chmod -R 755 /var/log/application/${pom.artifactId}
	echo Done.
}

function install_application() {
	echo Configuring application...
	mkdir -p /opt/application/${pom.artifactId}
	mv app/* /opt/application/${pom.artifactId}/.
	/bin/chown -R application:application /opt/application/${pom.artifactId}
	/bin/chmod 755 /opt/application/${pom.artifactId}/bin/${pom.artifactId}
	/bin/chmod 755 /opt/application/${pom.artifactId}/bin/wrapper-*
	echo Done.
}

function create_pid_folder() {
	echo Creating log folders for pid...
	mkdir -p /opt/application/${pom.artifactId}/logs
	/bin/chown -R application:application /opt/application/${pom.artifactId}/logs
	chmod -R 755 /opt/application/${pom.artifactId}/logs
	echo Done.
}

function install_service() {
	echo Installing service...
	ln -s /opt/application/${pom.artifactId}/bin/${pom.artifactId} /etc/init.d/${pom.artifactId}
	/bin/chmod 755 /etc/init.d/${pom.artifactId}
	# EPEL
	/sbin/chkconfig --add ${pom.artifactId}
	# Debian
	update-rc.d ${pom.artifactId} defaults
	echo Done.
}

# Execute functions
add_application_user
create_log_folders
install_application
create_pid_folder
install_service