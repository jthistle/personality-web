# Setup

## Database

First, the database must be setup. Run `games.sql` and `profiles.sql` to create the necessary tables.

## Config 

In config.js, set the IP to the one server.js is running on - this should be the domain name/address of the device that this everything is running on.

## Running

### Backend

`node backend/server.js`

`node backend/gameManager.js`

### The important part

For development: 

`yarn start`

**OR**

For production, first make sure `serve` is installed:

`sudo npm install -g serve`

Then:

`./setup/buildandrun.sh`

And it should run!