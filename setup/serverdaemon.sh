#!/usr/bin/env bash

### BEGIN INIT INFO
# Provides:		    perserver
# Required-Start:	$remote_fs $syslog
# Required-Stop:	$remote_fs $syslog
# Default-Start:	2 3 4 5
# Default-Stop:		0 1 6
# Short-Description:	Runs all the personality backend servers
### END INIT INFO

# This script should be copied to /etc/init.d

srcLocation = /         # Change this to the absolute location of the personality installation

node "$srcLocation"/backend/server.js &
node "$srcLocation"/backend/gameManager.js &
serve -s "$srcLocation"/build
