#! /bin/bash
# ${pom.artifactId} install script.
###

# Functions
function install_java(){
    sudo mkdir /opt/java
    sudo tar xf jre.gz* -C /opt/java/

    JAVA_HOME="/opt/java/`ls /opt/java/ | head -1`"
    JAVA_HOME_BIN="$JAVA_HOME/bin"

    sudo sed -i -e "/JAVA_HOME=/d" /etc/environment
    sudo echo "JAVA_HOME=$JAVA_HOME" | sudo tee -a /etc/environment

    OLD_PATH="$PATH"
    sudo sed -i -e "/PATH=/d" /etc/environment
    sudo echo "PATH=$JAVA_HOME_BIN:$OLD_PATH" | sudo tee -a /etc/environment

    sudo ln -s $JAVA_HOME/bin/java /usr/bin/java
}

function add_kixeye_user() {
	echo Adding user...
	/usr/sbin/groupadd kixeye
	/usr/sbin/useradd -g kixeye kixeye
	echo Done.
}

function create_log_folders() {
	echo Creating log folders...
	mkdir -p /var/log/kixeye/${pom.artifactId}
	/bin/chown -R kixeye:kixeye /var/log/kixeye/${pom.artifactId}
	chmod -R 755 /var/log/kixeye/${pom.artifactId}
	echo Done.
}

function install_application() {
	echo Configuring application...
	mkdir -p /opt/kixeye/${pom.artifactId}
	mv app/* /opt/kixeye/${pom.artifactId}/.
	/bin/chown -R kixeye:kixeye /opt/kixeye/${pom.artifactId}
	/bin/chmod 755 /opt/kixeye/${pom.artifactId}/bin/${pom.artifactId}
	/bin/chmod 755 /opt/kixeye/${pom.artifactId}/bin/wrapper-*
	echo Done.
}

function create_pid_folder() {
	echo Creating log folders for pid...
	mkdir -p /opt/kixeye/${pom.artifactId}/logs
	/bin/chown -R kixeye:kixeye /opt/kixeye/${pom.artifactId}/logs
	chmod -R 755 /opt/kixeye/${pom.artifactId}/logs
	echo Done.
}

function install_service() {
	echo Installing service...
	ln -s /opt/kixeye/${pom.artifactId}/bin/${pom.artifactId} /etc/init.d/${pom.artifactId}
	/bin/chmod 755 /etc/init.d/${pom.artifactId}
	# EPEL
	/sbin/chkconfig --add ${pom.artifactId}
	# Debian
	update-rc.d ${pom.artifactId} defaults
	echo Done.
}

# Execute functions
install_java
add_kixeye_user
create_log_folders
install_application
create_pid_folder
install_service