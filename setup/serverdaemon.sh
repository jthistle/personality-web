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

SRCLOCATION=/home/jthistle/personality-web         # Change this to the absolute location of the personality installation
PID_FILE=/tmp/perserver.pids

start() {
	echo "Starting..."
	if [ -f $PID_FILE ]; then
		echo "Service already started!"
	else
		node "$SRCLOCATION"/backend/server.js &
		echo $!	>> $PID_FILE
		node "$SRCLOCATION"/backend/gameManager.js &
		echo $! >> $PID_FILE
		serve -s "$SRCLOCATION"/build &
		echo $! >> $PID_FILE
	fi
}

stop() {
	echo "Stopping..."
	kill $(cat $PID_FILE)
	rm $PID_FILE
	echo "Stopped."
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    status)
        ;;
    *)
	echo "Usage: $0 {start|stop|status|restart}"
	;;
esac

exit 0
