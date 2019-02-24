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
		this.gamesList = {}; 	// games with id keys
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

	initGames() {
		return; 	// TEMP - TODO make this work
		for (var game of this.gamesToCreate) {
			var query = "UPDATE profiles SET inGame=1 WHERE id IN ("+game.join()+");";
			this.makeQuery(query).then((data) => {

			}).catch((error) => {
				console.log(error);
			});
		}
	}

	// Update the inGame status of all users
	refreshInGame() {
		var query = "SELECT id FROM profiles WHERE inGame=1;";
		this.makeQuery(query).then((data) => {
			if (data.length === 0)
				return;

			var usersInGame = [];
			for (var gameId in this.gamesList) {
				var game = this.gamesList[gameId];
				for (var id of game.users) {
					usersInGame.push(id);
				}
			}

			for (var user of data) {
				console.log(user);
				if (!usersInGame.includes(user.id)) {
					// TODO set not ingame
				}
			}
		});
	}

	refreshGamesList() {
		return new Promise((resolve, reject) => {
			var query = "SELECT * FROM games WHERE stage != 0;";
			this.makeQuery(query).then((games) => {
				this.gamesList = {};
				for (var game of games) {
					this.gamesList[game.id] = {
						id: game.id,
						users: JSON.parse(game.userids),
						stage: game.stage,
						hash: game.hash,
						stagestart: game.stagestart,
						coins: JSON.parse(game.coins),
						userchoices: JSON.parse(game.userchoices)
					}
				}
				resolve(true);
			});
		});
	}

	updateGame(id) {
		var thisGame = this.gamesList[id];

		var stage = thisGame.stage;
		var stagestart = thisGame.stagestart;
		var coins = JSON.stringify(thisGame.coins);
		var userchoices = JSON.stringify(thisGame.userchoices);

		var query = "UPDATE games SET stage="+stage+", stagestart="+stagestart+", coins='"+coins+"', userchoices='"+userchoices+"' WHERE id = "+id+";";
		this.makeQuery(query);
	}

	wait(delay) {
		return new Promise(resolve => setTimeout(resolve, delay));
	}

	async run() {
		while (true) {
			var startTime = Date.now();
			if (this.doQuit)
				break;

			await this.refreshGamesList();

			this.refreshInGame();

			this.updateGame(1);

			this.findWaiting();
			console.log(this.waiters);

			this.matchUsers();
			console.log(this.gamesToCreate);

			//this.initGames();

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
