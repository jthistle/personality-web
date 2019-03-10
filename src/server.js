const secrets 		= require('./secrets.js');
var express 		= require('express');
var graphqlHTTP		= require('express-graphql');
var { buildSchema } = require('graphql');
var mysql			= require('mysql');
const crypto 		= require('crypto');

var connection = mysql.createConnection({
	host	 : 'localhost',
	user	 : 'pers',
	password :  secrets.dbPwd,
	database : 'personality'
});

connection.connect();


// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
	type Query {
		hello: String,
		profile(hash: String!): Profile!,
		getWaitingCount(hash: String!): LobbyInfo!
	},
	type Mutation {
		createProfile(profileData: ProfileDataInput!, method: String!): String,
		setWaiting(hash: String!, isWaiting: Boolean!): LobbyInfo!,
		getGameDetails(hash: String!, userChoice: Int!): GameInfo!
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
		stageStart: Int!
	}
	#type Interactions {
	#},
`);

// Some values are cached, since the amount of people waiting is
// the same for every user.
var cachedWaitingTime = 0;
var cachedWaiting = 0;
const cachedWaitingInterval = 1; 	// interval in seconds between waiting count updates

function updateWaitingCount() {
	return new Promise((resolve, reject) => {
		var currentTime = Date.now() / 1000;

		if (cachedWaitingTime + cachedWaitingInterval > currentTime)
			resolve(cachedWaiting);

		var query = "SELECT COUNT(*) FROM profiles WHERE isWaiting=1 AND lastWaitingUpdate > "+Math.floor(currentTime-2)+";";
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

function getInGame(hash) {
	return new Promise((resolve, reject) => {
		connection.query("SELECT id FROM profiles WHERE hash='"+hash+"' AND inGame = 1 LIMIT 1;", function(error, results, fields) {
			if (error)
				reject(error);
			else
				resolve(results.length > 0);
		});
	});
}

// The root provides a resolver function for each API endpoint
var root = {
	hello: () => {
		// TODO remove
		return 'Hello world!';
	},

	profile: ({hash}) => {
		return new Promise((resolve, reject) => {
			connection.query("SELECT * FROM profiles WHERE hash='"+hash+"' LIMIT 1", function (error, results, fields) {
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
						//interactions: JSON.parse(results[0].interactions),
					});
				}
			});
		});
	},

	createProfile: ({profileData, method}) => {
		return new Promise((resolve, reject) => {
			var newHash = crypto.randomBytes(20).toString('hex');
			var strData = JSON.stringify(profileData);
			connection.query("INSERT INTO profiles (hash, profileData, method, interactions) VALUES ('"+newHash+"', '"+strData+"', '"+method+"', '{}');", function (error, results, fields) {
				if (error) 
					reject(error);
				else {
					resolve(newHash);
				}
			});
		});
	},

	setWaiting: ({ hash, isWaiting }) => {
		return new Promise((resolve, reject) => {
			var value = isWaiting ? 1 : 0;
			var currentTime = Math.floor(Date.now() / 1000);

			connection.query("UPDATE profiles SET isWaiting="+value+", lastWaitingUpdate="+currentTime+" WHERE hash='"+hash+"';", function (error, results, fields) {
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

	// This returns the user choices and coins as a json array
	getGameDetails: ({ hash, userChoice }) => {
		return new Promise((resolve, reject) => {
			if (userChoice < 0 || userChoice > 2)
				return;

			connection.query("SELECT id, gameHash FROM profiles WHERE hash='"+hash+"';", function (error, results, fields) {
				var gameHash = results[0].gameHash;
				var userId = results[0].id;

				connection.query("SELECT stage, stagestart, coins, userChoices FROM games WHERE hash='"+gameHash+"';", function (error, results, fields) {
					if (error) {
						console.error(error);
						reject(error);
					}

					var choices = JSON.parse(results[0].userChoices);
					var coins = results[0].coins;
					var stage = results[0].stage;
					var stageStart = results[0].stagestart;

					// Set user choice
					choices[userId] = userChoice;

					var newUserChoices = JSON.stringify(choices);

					var returnObj = {
							coins: coins,
							gameStage: stage,
							stageStart: stageStart
						}

					if (stage % 2 == 1 || stage == 0)
						returnObj.userChoices = newUserChoices;

					connection.query("UPDATE games SET userChoices='"+newUserChoices+"' WHERE hash='"+gameHash+"';", function (error, results, fields) {
						if (error) {
							console.error(error);
							reject(error);
						} else
							resolve(returnObj);
					});
				});
			});
		});
	},
};

var app = express();
app.use("/graphql", graphqlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');
