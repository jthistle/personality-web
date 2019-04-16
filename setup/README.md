# Setup

## Database

First, the database must be setup. Run `games.sql` and `profiles.sql` to create the necessary tables.

## Config 

In setupProxy.js, set the IP to the one server.js is running on - this should be the local IP address of the device that this everything is running on. Set the URL of config.js to also have this same IP, or do something. I don't have
a clue how the proxy works to be honest.

## Running

### Backend

`node src/server.js`

`node src/gameManager.js`

### The important part

For development: 

`yarn start`

**OR**

For production, first make sure `serve` is installed:

`sudo npm install -g serve`

Then:

`./setup/buildandrun.sh`

And it should run!