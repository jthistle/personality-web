const secrets = require('./secrets.js');
var express = require('express');
var graphqlHTTP = require('express-graphql');
var cors = require('cors');
var { buildSchema } = require('graphql');
var mysql = require('mysql');
const crypto = require('crypto');
const fs = require('fs');

// Init the MySQL connection
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'pers',
	password: secrets.dbPwd,
	database: 'personality'
});

connection.connect();

// Domains that we'll accept requests from
const WHITELISTED = [
	"192.168.0.9",
	"localhost",
];

// Check if a domain is whitelisted to accept requests from
function isWhitelisted(origin) {
	for (domain of WHITELISTED) {
		if (domain.includes(origin))
			return true;
	}
	return false;
}

// Construct the GraphQL schema
var schema = buildSchema(`
	type Query {
		hello: String,
		profile(hash: String!): Profile!,
		getWaitingCount(hash: String!): LobbyInfo!
	},
	type Mutation {
		createProfile(profileData: ProfileDataInput!, method: String!): String,
		setWaiting(hash: String!, isWaiting: Boolean!): LobbyInfo!,
		getGameDetails(hash: String!, userChoice: Int!, offset: Int!): GameInfo!,
		sendMessage(hash: String!, message: String!): Boolean,
		sendOpinion(hash: String!, mostLiked: Boolean!, userId: Int!): Boolean
	},
	type Profile {
		id: ID,
		hash: String,
		profileData: ProfileData,
		#interactions: Interactions,
	},
	input ProfileDataInput {
		o: Float,
		c: Float,
		e: Float,
		a: Float,
		n: Float,
	},
	type ProfileData {
		o: Float,
		c: Float,
		e: Float,
		a: Float,
		n: Float,
	},
	type LobbyInfo {
		waitingCount: Int,
		inGame: Boolean,
	},
	type GameInfo {
		gameStage: Int!,
		userChoices: String,
		coins: String!,
		stageStart: Int!,
		userId: Int!,
		messages: [Message]!,
		newOffset: Int!,
		opinion: Opinion,
		question: String
	},
	type Message {
		userId: Int!,
		text: String!
	},
	type Opinion {
		mostLiked: Int,
		leastLiked: Int
	}
	#type Interactions {
	#},
`);

// Some values are cached, since the amount of people waiting is
// the same for every user.
var cachedWaitingTime = 0;
var cachedWaiting = 0;
const cachedWaitingInterval = 1; 	// interval in seconds between waiting count updates

const chatsPath = "games/";
const minMessageGap = 3; 	// seconds
const maxMessageLen = 200;

var cachedChats = {};
var lastMessages = {};

//
// 	updateWaitingCount()
//	This asynchronously either retrieves the cached value of the waiting count, or
//	it queries the database for the current waiting count. Used by multiple resolvers.
// 	TODO: write an actual cache manager. 
//
function updateWaitingCount() {
	return new Promise((resolve, reject) => {
		var currentTime = Date.now() / 1000;

		if (cachedWaitingTime + cachedWaitingInterval > currentTime)
			resolve(cachedWaiting);

		var query = "SELECT COUNT(*) FROM profiles WHERE isWaiting=1 AND lastWaitingUpdate > " + Math.floor(currentTime - 2) + ";";
		connection.query(query, function (error, results, fields) {
			if (error)
				reject(error);
			else {
				// Update cache values
				cachedWaiting = results[0]["COUNT(*)"];
				cachedWaitingTime = Date.now() / 1000;
				resolve(cachedWaiting);
			}
		});
	});
}


//
// 	getInGame()
//	This asynchronously checks if a user is in a game or not, based on the inGame flag in the database.
// 	Used by multiple resolvers.
//
function getInGame(hash) {
	return new Promise((resolve, reject) => {
		connection.query("SELECT id FROM profiles WHERE hash='" + hash + "' AND inGame = 1 LIMIT 1;", function (error, results, fields) {
			if (error)
				reject(error);
			else
				resolve(results.length > 0);
		});
	});
}

//
// 	initChat(gameHash: string)
//	This initialises a chat object if not already created, by either reading an existing file
//  from the directory at chatsPath, or creating a new object and a chat file to go with it.
//
function initChat(gameHash) {
	// Init chat if not created
	if (!(gameHash in cachedChats)) {
		var chatPath = chatsPath + gameHash + ".txt";
		var fd = fs.openSync(chatPath, "a+");
		var thisChat = fs.readFileSync(chatPath, { encoding: "utf8" });
		var tempChat;
		if (thisChat != "") {
			tempChat = JSON.parse(thisChat);
		} else {
			tempChat = [];
		}

		cachedChats[gameHash] = tempChat;
	}
}

//
// 	writeChat(gameHash: string)
//	Writes a cached chat to the game file.
//
function writeChat(gameHash) {
	if (gameHash in cachedChats) {
		var chatPath = chatsPath + gameHash + ".txt";
		fs.writeFileSync(chatPath, JSON.stringify(cachedChats[gameHash]));
		console.log("wrote chat " + gameHash);
	}
}

//
// 	getGameHash(hash: string)
//	Takes a user hash, and async returns the gameHash of the user's current game and
//	the user's userId. 
//
function getGameHash(hash) {
	return new Promise((resolve, reject) => {
		connection.query("SELECT id, gameHash FROM profiles WHERE hash = ?;", [hash], function (error, results, fields) {
			if (error)
				return reject(error);

			if (results.length === 0)
				return reject(false);

			resolve(
				{
					gameHash: results[0].gameHash,
					userId: results[0].id
				}
			);
		});
	});
}

// The root provides a resolver function for each API endpoint
var root = {
	hello: () => {
		// TODO remove
		return 'Hello world!';
	},

	//
	// 	profile(hash: String!)
	//	returns information about a profile with a given hash
	//
	profile: ({ hash }) => {
		return new Promise((resolve, reject) => {
			connection.query("SELECT * FROM profiles WHERE hash = ? LIMIT 1", [hash], function (error, results, fields) {
				if (error) {
					reject(error);
					return;
				}

				if (results.length == 0) {
					reject("Profile not found");
				} else {
					resolve({
						id: results[0].id,
						hash: results[0].hash,
						profileData: JSON.parse(results[0].profileData),
					});
				}
			});
		});
	},

	//
	// 	createProfile(profileData: String!, method: String!)
	//	Creates a profile, returns its new hash. TODO: apply a limiter to this on the react front-end.
	//  Method should be one of ['a', 'b'], profileData should be a JSON-encoded array.
	//
	createProfile: ({ profileData, method }) => {
		return new Promise((resolve, reject) => {
			var newHash = crypto.randomBytes(20).toString('hex');
			var strData = JSON.stringify(profileData);
			connection.query("INSERT INTO profiles (hash, profileData, method, interactions) VALUES (?, ?, ?, '{}');", [newHash, strData, method], function (error, results, fields) {
				if (error)
					reject(error);
				else {
					resolve(newHash);
				}
			});
		});
	},

	//
	// 	setWaiting(hash: String!, isWaiting: Boolean!)
	//	Sets the isWaiting flag of a user in the database, acknowledging that they want to join
	// 	a game. The rest is handled by the game manager.
	//
	setWaiting: ({ hash, isWaiting }) => {
		return new Promise((resolve, reject) => {
			var value = isWaiting ? 1 : 0;
			var currentTime = Math.floor(Date.now() / 1000);

			connection.query("UPDATE profiles SET isWaiting = ?, lastWaitingUpdate = ? WHERE hash = ?;", [value, currentTime, hash], function (error, results, fields) {
				if (error)
					reject(error);
				else {
					updateWaitingCount().then((data) => {
						getInGame(hash).then((isInGame) => {
							resolve({
								waitingCount: data,
								inGame: isInGame
							});
						});
					});
				}
			});
		});
	},

	//
	// 	getWaitingCount(hash: String!)
	//	Simply returns the number of people waiting for a game, to provide a count for the
	// 	lobby view.
	//
	getWaitingCount: ({ hash }) => {
		return new Promise((resolve, reject) => {
			updateWaitingCount().then((data) => {
				getInGame(hash).then((isInGame) => {
					resolve({
						waitingCount: data,
						inGame: isInGame
					});
				});
			});
		});
	},

	//
	// 	getGameDetails(hash: String!, userChoice: Int!, offset: Int!)
	//	Returns all the details of a game, based on a user id. TODO: caching.
	//
	getGameDetails: ({ hash, userChoice, offset }) => {
		return new Promise((resolve, reject) => {
			if (userChoice < 0 || userChoice > 2)
				return;

			getGameHash(hash).then((data) => {
				var gameHash = data.gameHash;
				var userId = data.userId;

				initChat(gameHash);

				var tempMessages = [];
				if (cachedChats[gameHash].length > offset) {
					tempMessages = cachedChats[gameHash].slice(offset, cachedChats.length);
				}

				connection.query("SELECT stage, stagestart, coins, userChoices, opinions, question FROM games WHERE hash = ?;", [gameHash], function (error, results, fields) {
					if (error) {
						console.error(error);
						reject(error);
					}

					var choices = JSON.parse(results[0].userChoices);
					var coins = results[0].coins;
					var stage = results[0].stage;
					var stageStart = results[0].stagestart;
					var opinions = JSON.parse(results[0].opinions);
					var question = results[0].question;
					var tempOpinion = {};

					if (userId.toString() in opinions)
						tempOpinion = opinions[userId.toString()];

					// Set user choice, but only if we're in play
					if (stage !== 0 && stage % 2 !== 1)
						choices[userId] = userChoice;

					var newUserChoices = JSON.stringify(choices);

					var returnObj = {
						coins: coins,
						gameStage: stage,
						stageStart: stageStart,
						userId: userId,
						messages: tempMessages,
						newOffset: cachedChats[gameHash].length,
						opinion: tempOpinion,
						question: question,
					}

					if (stage % 2 == 1 || stage == 0)
						returnObj.userChoices = newUserChoices;

					connection.query("UPDATE games SET userChoices = ? WHERE hash = ?;", [newUserChoices, gameHash], function (error, results, fields) {
						if (error) {
							console.error(error);
							reject(error);
						} else
							resolve(returnObj);
					});
				});
			}).catch(data => {
				console.error("Error with getting game details.");
			});
		});
	},

	//
	//	sendMessage(hash: String!, message: String!)
	// 	Sends a message to the chat of the game that the user is currently in.
	//
	sendMessage: ({ hash, message }) => {
		return new Promise((resolve, reject) => {
			var currentTime = Date.now() / 1000;
			if (hash in lastMessages) {
				if (currentTime - lastMessages[hash] < minMessageGap) {
					// This is terminal, so do not continue
					return resolve(false);
				}
			}

			getGameHash(hash).then((data) => {
				var gameHash = data.gameHash;
				var userId = data.userId;

				initChat(gameHash);

				cachedChats[gameHash].push({ userId: userId, text: message.substring(0, maxMessageLen) });
				lastMessages[hash] = currentTime;

				//writeChat(gameHash);
				resolve(true);
			}).catch(data => {
				console.error("Error with getting game details.");
			});
		});
	},

	//
	//	sendOpinion(hash: String!, mostLiked: Boolean!, userId: Int!)
	// 	Sends the final judgement of a user of who their most/least favourite person in the
	//  game was.
	//
	sendOpinion: ({ hash, mostLiked, userId }) => {
		return new Promise((resolve, reject) => {
			getGameHash(hash).then((data) => {
				var gameHash = data.gameHash;
				var chooserId = data.userId;

				connection.query("SELECT opinions, userids FROM games WHERE hash = ?;", [gameHash], function (error, results, fields) {
					var ids = JSON.parse(results[0].userids);
					if (!ids.includes(userId)) {
						console.warn(userId + " not in " + ids);
						return reject(false);
					}

					var opinions = JSON.parse(results[0].opinions);
					var chooserKey = chooserId.toString();

					if (!(chooserId.toString() in opinions))
						opinions[chooserKey] = {};

					if (mostLiked) {
						if (opinions[chooserKey].leastLiked == userId)
							opinions[chooserKey].leastLiked = null;

						opinions[chooserKey].mostLiked = userId;
					} else {
						if (opinions[chooserKey].mostLiked == userId)
							opinions[chooserKey].mostLiked = null;

						opinions[chooserKey].leastLiked = userId;
					}

					opinions = JSON.stringify(opinions);

					connection.query("UPDATE games SET opinions = ? WHERE hash = ?;", [opinions, gameHash], function (error, results, fields) {
						if (error)
							reject(false);
						else
							resolve(true);
					});
				});
			}).catch(data => {
				console.error("Error with getting game details.");
			});
		});
	},
};

// Handle interrupts and gracefully end the server. TODO: handle all requests to stop,
// not just SIGINT.
process.on("SIGINT", () => {
	console.log("\nExiting server for personality-web...");

	// write all chats
	for (hash in cachedChats) {
		writeChat(hash);
	}

	process.exit();
});

//
//	Setup and run the server
//
var app = express();

// Options for CORS
var corsOptions = {
	origin: function (origin, callback) {
		if (isWhitelisted(origin)) {
			callback(null, true);
		} else {
			callback("", true);
		}
	}
}

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use("/graphql", graphqlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');
