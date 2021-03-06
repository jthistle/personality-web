//
// The game manager matches users, organises and directs games, and keeps tabs
// on the whole game/matchmaking system.
//

const secrets 		= require('./secrets.js');
var mysql			= require('mysql');
const crypto 		= require('crypto');
const questions 	= require("./questions.json");
var winston 		= require('winston');

// First, init the logger
const logger = winston.createLogger({
	level: "info",
	format: winston.format.json(),
	defaultMeta: { service: "persGameManager" },
	transports: [
		new winston.transports.File({ filename: __dirname + "/error.log", level: "error" }),
		new winston.transports.File({ filename: __dirname + "/combined.log" })
	]
});

const MAX_USERS_PER_GAME = 5;
const MIN_USERS_PER_GAME = 3;

// How long to wait once a number of users is met
const WAITFOR = [0, 0, 40, 20, 0];

const ROUND_TIME = 45;
const POST_ROUND_TIME = 15;
const PREGAME_TIME = POST_ROUND_TIME;	// legacy, hacky

const ROUND_COUNT = 4;

const HOLD_COIN_AMOUNT = 100;

class GameManager {
	constructor(con) {
		this.con = con;
		this.doQuit = false;
		this.waiters = [];
		this.gamesToCreate = [];		// an array of arrays of users ids of users who are matched	
		this.gamesList = {}; 	// games with id keys
		this.waitingForGameTime = {};
	}

	setCon(con) {
		this.con = con;
	}

	// Helper function to make a query
	makeQuery(query) {
		return new Promise((resolve, reject) => {
			this.con.query(query, function (error, results, fields) {
				if (error) {
					logger.error(error);
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
							this.waiters.push(id);
							if (!(id in this.waitingForGameTime)) {
								this.waitingForGameTime[id] = currentTime;
							}
						}
					}
					resolve(true);
				});
		});
	}

	matchUsers() {
		return new Promise((resolve, reject) => {
			var currentGame = [];

			var currentTime = Date.now()/1000;

			var waitTime = 0;
			var doMatch = false;
			if (this.waiters.length >= MIN_USERS_PER_GAME && this.waiters.length < MAX_USERS_PER_GAME)
				waitTime = WAITFOR[this.waiters.length - 1];
			else if (this.waiters.length >= MAX_USERS_PER_GAME)
				doMatch = true;

			// Only match users if one has been waiting beyond the specified wait time
			// This allows us to create larger games.
			if (!doMatch && this.waiters.length >= MIN_USERS_PER_GAME) {
				for (var id in this.waitingForGameTime) {
					if (this.waiters.indexOf(parseInt(id)) === -1) {
						delete this.waitingForGameTime[id];
						continue;
					}

					var since = this.waitingForGameTime[id];
					if (currentTime > since + waitTime) {
						logger.info("User "+id+" has waited long enough, should match now");
						doMatch = true;
						break;
					}
				}
			}

			while (doMatch && this.waiters.length + currentGame.length >= MIN_USERS_PER_GAME) {
				var ind = Math.floor(Math.random() * (this.waiters.length));
				if (ind == this.waiters.length)
					ind--;

				var userId = this.waiters[ind];
				currentGame.push(userId);
				this.waiters.splice(ind, 1);
				delete this.waitingForGameTime[userId];

				if (currentGame.length == MAX_USERS_PER_GAME || this.waiters.length == 0) {
					this.gamesToCreate.push(currentGame);
					logger.info("Matched users: "+ currentGame);
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
			var userIds = JSON.stringify(game);
			var strTempl = JSON.stringify(template);
			var question = questions[Math.floor(Math.random() * questions.length)]

			var query = "INSERT INTO games (userids, stage, hash, stagestart, coins, userchoices, question)\
					 VALUES ('"+userIds+"', 1, '"+newHash+"', "+nowTime+", '"+strTempl+"', '"+strTempl+"', '"+question+"')";
			this.makeQuery(query).then((data) => {
				var getId = "SELECT id FROM games WHERE hash = '"+newHash+"'";
				this.makeQuery(getId).then((data) => {
					// add game to local games list
					var id = data[0].id;
					this.gamesList[id] = {
						id: id,
						users: game,
						stage: 1,
						hash: newHash,
						stagestart: nowTime,
						coins: template,
						userchoices: template
					}
				});

				var setGame = "UPDATE profiles SET inGame=1, gameHash='"+newHash+"' WHERE id IN ("+game.join()+");";			
				this.makeQuery(setGame);
				logger.info(newHash+": created game");
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
					logger.error(error);
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

	// Go and update the clocks in all games etc
	// 
	// Stages are:
	// 0 - game ended
	// 1 - pregame
	// 2 - round one play
	// 3 - post-round one
	// 4 - round two play etc.
	// 
	// When a game ends, users should be surveyed
	// Choices:
	// 0 - hold (default)
	// 1 - split
	// 2 - grab
	updateGames() {
		var currentTime = Math.floor(Date.now() / 1000);
		for (var gameId in this.gamesList) {
			var game = this.gamesList[gameId];

			// We are in pregame
			if (game.stage === 0)
				logger.warn("We really shouldn't be at this point...");
			else if (game.stage === 1) {
				if (currentTime > game.stagestart + PREGAME_TIME) {
					game.stage++;
					game.stagestart = currentTime;
					this.updateGame(gameId);
					logger.info(game.hash+": pregame over, starting");
				}
			}
			// We are in play
			else if (game.stage % 2 === 0) {
				if (currentTime > game.stagestart + ROUND_TIME) {
					var grabbers = [];
					var splitters = [];
					var holders = [];

					var jackpot = game.users.length * 2 * HOLD_COIN_AMOUNT;

					// Populate user choice lists
					for (var userId in game.userchoices) {
						var choice = game.userchoices[userId];

						if (choice === 0)
							holders.push(userId);
						else if (choice === 1)
							splitters.push(userId);
						else if (choice === 2)
							grabbers.push(userId);
						else
							logger.warn("invalid choice: " + choice);
					}

					// Give coins to grabbers and splitters
					if (grabbers.length === 1) {
						var winnerId = grabbers[0];
						game.coins[winnerId] += jackpot;
					} else if (splitters.length > 0) {
						var winningEach = Math.floor(jackpot / splitters.length);
						for (var splitterId of splitters) {
							game.coins[splitterId] += winningEach;
						}
					}

					// Give coins to holders
					for (var holderId of holders)
						game.coins[holderId] += HOLD_COIN_AMOUNT;

					game.stage++;
					game.stagestart = currentTime;
					this.updateGame(gameId);

					logger.info(game.hash + ": moved to post-round, stage is now " + game.stage);
				}
			}
			// We are in post-round
			else if (game.stage % 2 === 1) {
				if (currentTime > game.stagestart + POST_ROUND_TIME) {
					// Check if we're finished
					if ((game.stage - 1)/2 >= ROUND_COUNT) {
						game.stage = 0;
						game.stagestart = currentTime;
					} else {
						// Reset for new round
						for (var userId in game.userchoices) {
							game.userchoices[userId] = 0;
						}

						game.stage++;
						game.stagestart = currentTime;
					}
					this.updateGame(gameId);

					logger.info(game.hash+": moved to next round, stage is now "+ game.stage);
				}
			}
		}
	}

	wait(delay) {
		return new Promise(resolve => setTimeout(resolve, delay));
	}

	// This is async - so only call functions that can run side-by-side
	// i.e. functions that use data that is independent of other functions
	async run() {
		while (true) {
			var startTime = Date.now();
			if (this.doQuit)
				break;

			await this.refreshGamesList();

			this.refreshInGame();

			this.doMatchmaking();

			this.updateGames();

			// Wait so that we have at least a second in between loops
			var remainingTime = 1000 - (Date.now() - startTime);
			if (remainingTime > 0) {
				await this.wait(remainingTime);
			}
		}

		cleanup();
	}

	cleanup() {
		// Put any cleanup here
		logger.info("Manager: ended execution");
		process.exit(0);
	}

	quit() {
		this.doQuit = true;
	}
}

var connection;
var manager = new GameManager(connection);

// We're not going to bother with GraphQL for this, rather, just
// connect directly to the database.
function restartSqlConnection() {
	connection = mysql.createConnection({
		host: 'localhost',
		user: secrets.uname,
		password: secrets.dbPwd,
		database: 'personality'
	});

	connection.connect(handleSqlError);
	connection.on("error", handleSqlError);

	manager.setCon(connection);
}

function handleSqlError(error) {
	if (!error)
		return;

	logger.error("SQL Error: " + error.code + ": " + error);
	if (error.code === "PROTOCOL_CONNECTION_LOST") {
		restartSqlConnection();
	} else {
		throw error;
	}
}

restartSqlConnection();

process.on("SIGINT", endManager);
process.on("SIGTERM", endManager);

function endManager() {
	logger.info("\nExiting game manager for personality-web...");
    manager.cleanup();
    process.exit();
}

logger.info("Running game manager...");
manager.run();
