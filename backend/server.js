const secrets  		= require('./secrets.js');
var express 		= require('express');
var graphqlHTTP 	= require('express-graphql');
var cors 			= require('cors');
var { buildSchema } = require('graphql');
var mysql 			= require('mysql');
const crypto 		= require('crypto');
const fs 			= require('fs');
var cacheManager 	= require("./cacheManager.js");
var badWords 		= require('bad-words');

// Init the MySQL connection
var connection = mysql.createConnection({
	host: 'localhost',
	user: secrets.uname,
	password: secrets.dbPwd,
	database: 'personality'
});

connection.connect();

// Set up bad words filter
var filter = new badWords({ placeHolder: '❤'});

// Domains that we'll accept requests from
const WHITELISTED = [
	"192.168.0.9",
	"localhost",
	"spbriggs.co.uk"
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

// Init cache manager
var cache = new cacheManager();

// The amount of people waiting is the same for every user, so cache it
cache.newObject("waiting", 1000);
cache.newAssoc("gameDetails", 1000);

const chatsPath = "games/";
const minMessageGap = 3; 	// seconds
const maxMessageLen = 200;

var cachedChats = {};
var lastMessages = {};

//
// 	updateWaitingCount()
//	This asynchronously either retrieves the cached value of the waiting count, or
//	it queries the database for the current waiting count. Used by multiple resolvers.
//
function updateWaitingCount() {
	return new Promise((resolve, reject) => {
		var currentTime = Date.now() / 1000;

		if (!cache.needsUpdate("waiting"))
			return resolve(cache.get("waiting"));

		var query = "SELECT COUNT(*) FROM profiles WHERE isWaiting=1 AND lastWaitingUpdate > " + Math.floor(currentTime - 2) + ";";
		connection.query(query, function (error, results, fields) {
			if (error)
				reject(error);
			else {
				// Update cache values
				waitingCount = results[0]["COUNT(*)"];
				cache.set("waiting", waitingCount);
				resolve(waitingCount);
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
			connection.query("INSERT INTO profiles (hash, profileData, method) VALUES (?, ?, ?);", [newHash, strData, method], function (error, results, fields) {
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
	//	Returns all the details of a game, based on a user id.
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

				var mustUpdateGameDetails = cache.needsUpdate("gameDetails", gameHash);

				var query;
				if (mustUpdateGameDetails)
					query = "SELECT stage, stagestart, coins, userChoices, opinions, question FROM games WHERE hash = ?;";
				else 
					query = "SELECT userChoices FROM games WHERE hash = ?;";

				connection.query(query, [gameHash], function (error, results, fields) {
					if (error) {
						console.error(error);
						reject(error);
					}

					// This will never be cached
					var choices = JSON.parse(results[0].userChoices);

					var cachedDetails;
					var coins;
					var stage;
					var stageStart;
					var opinions;
					var question;

					if (mustUpdateGameDetails) {
						coins = results[0].coins;
						stage = results[0].stage;
						stageStart = results[0].stagestart;
						opinions = JSON.parse(results[0].opinions);
						question = results[0].question;
					} else {
						var allCached = cache.get("gameDetails", gameHash);
						cachedDetails = allCached.obj;
						opinions      = allCached.opinions;

						stage = cachedDetails.stage;
						//console.log(JSON.stringify(cachedDetails));
					}

					// Get the user's specific opinion
					var tempOpinion = {};
					if (userId.toString() in opinions)
						tempOpinion = opinions[userId.toString()];

					// Set user choice, but only if we're in play
					if (stage !== 0 && stage % 2 !== 1)
						choices[userId] = userChoice;

					// Init and create the return object
					var returnObj;
					if (mustUpdateGameDetails) {
						returnObj = {
							coins: coins,
							gameStage: stage,
							stageStart: stageStart,
							messages: tempMessages,
							question: question,
						}
					} else {
						returnObj = cachedDetails;
					}

					// Update the cache if needed, but only with general game things - not
					// user specific things, these are set later
					if (mustUpdateGameDetails) {
						cache.set("gameDetails", { obj: returnObj, opinions: opinions }, gameHash);
					}

					// Set user specific things
					// First, update the user choices array
					var newUserChoices = JSON.stringify(choices);
					if (stage % 2 == 1 || stage == 0)
						returnObj.userChoices = newUserChoices;

					returnObj.userId = userId;
					returnObj.newOffset = cachedChats[gameHash].length;
					returnObj.opinion = tempOpinion;

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

			message = filter.clean(message);

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
