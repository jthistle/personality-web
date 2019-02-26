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
		this.gamesToCreate = [];		// an array of arrays of users ids of users who are matched	
		this.gamesList = {}; 	// games with id keys
	}

	// Helper function to make a query
	makeQuery(query) {
		return new Promise((resolve, reject) => {
			this.con.query(query, function (error, results, fields) {
				if (error) {
					console.error(error);
					reject(error);
				} else {
					resolve(results);
				}
			});
		});
	}

	userPendingGameCreation(id) {
		for (var game of this.gamesToCreate) {
			if (game.includes(id))
				return true;
		}
		return false;
	}

	// Find all waiting users and put their ids in the waiters array
	findWaiting() {
		return new Promise((resolve, reject) => {
			var currentTime = Date.now() / 1000;
			var minTime = Math.floor(currentTime-2);
			var query = "SELECT id, hash FROM profiles WHERE isWaiting = 1 AND inGame = 0 AND lastWaitingUpdate > "+minTime+";"
			this.makeQuery(query)
				.then((data) => {
					this.waiters = [];
					for (var i=0; i < data.length; i++) {
						var id = data[i].id;
						if (!this.userPendingGameCreation(id)) {
							this.waiters.push(data[i].id);
						}
					}
					resolve(true);
				});
		});
	}

	matchUsers() {
		return new Promise((resolve, reject) => {
			var currentGame = [];
			while (this.waiters.length + currentGame.length >= MIN_USERS_PER_GAME) {
				var ind = Math.floor(Math.random() * (this.waiters.length));
				if (ind == this.waiters.length)
					ind--;

				var userId = this.waiters[ind];
				currentGame.push(userId);
				this.waiters.splice(ind, 1);

				if (currentGame.length == MAX_USERS_PER_GAME || this.waiters.length == 0) {
					this.gamesToCreate.push(currentGame);
					currentGame = [];
				}
			}
			resolve(true);
		});
	}

	doMatchmaking() {
		this.findWaiting().then(() => {
			this.matchUsers().then(() => {
				this.initGames();
			});
		});
	}

	initGames() {
		for (var i = 0; i < this.gamesToCreate.length; i++) {
			var game = this.gamesToCreate[i];
			var newHash = crypto.randomBytes(20).toString('hex');
			var nowTime = Math.floor(Date.now()/1000);
			var template = {};
			for (var id of game) {
				template[id] = 0;
			}
			var strTempl = JSON.stringify(template);

			var query = "INSERT INTO games (userids, stage, hash, stagestart, coins, userchoices)\
					 VALUES ('"+game.join()+"', 0, '"+newHash+"', "+nowTime+", '"+strTempl+"', '"+strTempl+"')";
			this.makeQuery(query).then((data) => {
				var getId = "SELECT id FROM games WHERE hash = '"+newHash+"'";
				this.makeQuery(getId).then((data) => {
					// add game to local games list
					var id = data[0].id;
					this.gamesList[id] = {
						id: id,
						users: game,
						stage: 0,
						hash: newHash,
						stagestart: nowTime,
						coins: template,
						userchoices: template
					}
				});

				var setGame = "UPDATE profiles SET inGame=1, gameHash='"+newHash+"' WHERE id IN ("+game.join()+");";			
				this.makeQuery(setGame);
			});
		}

		// Games have been created, clear list
		this.gamesToCreate = [];
	}

	// Update the inGame status of all users
	refreshInGame() {
		var query = "SELECT id FROM profiles WHERE inGame=1;";
		this.makeQuery(query).then((data) => {
			if (data.length === 0)
				return;

			// Get all users in a live game
			var usersInGame = [];
			for (var gameId in this.gamesList) {
				var game = this.gamesList[gameId];
				for (var id of game.users) {
					usersInGame.push(id);
				}
			}

			// Iterate over users who have inGame set
			var usersToReset = [];
			for (var user of data) {
				if (!usersInGame.includes(user.id)) {
					usersToReset.push(user.id);
				}
			}

			// Set users who have inGame set but aren't in a live game
			// to have inGame = 0.
			if (usersToReset.length > 0) {
				var query = "UPDATE profiles SET inGame=0 WHERE id IN ("+usersToReset.join()+");";
				this.makeQuery(query).catch((error) => {
					console.error(error);
				});
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

			this.doMatchmaking();

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
