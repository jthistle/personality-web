//
// The game manager matches users, organises and directs games, and keeps tabs
// on the whole game/matchmaking system.
//

const secrets 		= require('./secrets.js');
var mysql			= require('mysql');
const crypto 		= require('crypto');

// We're not going to bother with GraphQL for this, rather, just
// connect directly to the database.
var connection = mysql.createConnection({
	host	 : 'localhost',
	user	 : 'pers',
	password :  secrets.dbPwd,
	database : 'personality'
});

connection.connect();

const MAX_USERS_PER_GAME = 5;
const MIN_USERS_PER_GAME = 3;

class GameManager {
	constructor(con) {
		this.con = con;
		this.doQuit = false;
		this.waiters = [];
		this.occupiedWaiters = [];	 // waiters who are being allocated a game, but don't have inGame set yet
		this.gamesToCreate = [];
		this.lockWaiters = false;
	}

	makeQuery(query) {
		return new Promise((resolve, reject) => {
			this.con.query(query, function (error, results, fields) {
				if (error) {
					//console.error(error);
					reject(error);
				} else {
					resolve(results);
				}
			});
		});
	}

	findWaiting() {
		var currentTime = Date.now() / 1000;
		var minTime = Math.floor(currentTime-2);
		var query = "SELECT id, hash FROM profiles WHERE isWaiting = 1 AND inGame = 0 AND lastWaitingUpdate > "+minTime+";"
		this.makeQuery(query)
			.then((data) => {
				this.lockWaiters = true;
				this.waiters = [];
				for (var i=0; i < data.length; i++) {
					var id = data[i].id;
					if (!this.occupiedWaiters.includes(id))
						this.waiters.push(data[i].id);
				}
				this.lockWaiters = false;
			}).catch((error) => {
				console.error(error);
			});
	}

	matchUsers() {
		// Since findWaiting will update waiters asynchronously, we need to make sure it's not
		// in the process of rebuilding it.
		if (this.lockWaiters)
			return false;

		var currentGame = [];
		while (this.waiters.length + currentGame.length >= MIN_USERS_PER_GAME) {
			var ind = Math.floor(Math.random() * (this.waiters.length));
			if (ind == this.waiters.length)
				ind--;

			var userId = this.waiters[ind];
			currentGame.push(userId);
			this.occupiedWaiters.push(userId);
			this.waiters.splice(ind, 1);

			if (currentGame.length == MAX_USERS_PER_GAME || this.waiters.length == 0) {
				this.gamesToCreate.push(currentGame);
				currentGame = [];
			}
		}
	}

	initGame() {

	}

	wait(delay) {
		return new Promise(resolve => setTimeout(resolve, delay));
	}

	async run() {
		while (true) {
			var startTime = Date.now();
			if (this.doQuit)
				break;

			this.findWaiting();
			console.log(this.waiters);

			this.matchUsers();
			console.log(this.gamesToCreate);

			// Wait so that we have at least a second in between loops
			var remainingTime = 1000 - (Date.now() - startTime);
			if (remainingTime > 0) {
				await this.wait(remainingTime);
			}
		}

		// Put any cleanup here
		console.log("ended execution");
		process.exit(0);
	}

	quit() {
		this.doQuit = true;
	}
}

var manager = new GameManager(connection);

manager.run();
