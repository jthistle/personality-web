const dbPwd = require('./secrets.js');

var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');
var mysql			= require('mysql');

const crypto = require('crypto');

var connection = mysql.createConnection({
	host	 : 'localhost',
	user	 : 'pers',
	password : 'TestingDbPassword!',
	database : 'personality'
});

connection.connect();


// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
	type Query {
		hello: String,
		rollDice(numDice: Int!, numSides: Int): [Int],
		profile(hash: String!): Profile,
		createProfile(profileData: ProfileDataInput!): String,
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
	#type Interactions {
	#},
`);

// The root provides a resolver function for each API endpoint
var root = {
	hello: () => {
		return 'Hello world!';
	},

	rollDice: ({numDice, numSides}) => {
		console.log('Rolling dice');
		var output = [];
		for (var i = 0; i < numDice; i++) {
			output.push(1 + Math.floor(Math.random() * (numSides || 6)));
		}
		return output;
	},

	profile: ({hash}) => {
		return new Promise((resolve, reject) => {
			connection.query('SELECT * FROM profiles WHERE hash="'+hash+'" LIMIT 1', function (error, results, fields) {
				if (error) reject(error);
				console.log('Profile 1: ', results[0]);
				resolve({
					id: results[0].id,
					hash: results[0].hash,
					profileData: JSON.parse(results[0].profileData),
					//interactions: JSON.parse(results[0].interactions),
				});
			});
		});
	},

	createProfile: ({profileData}) => {
		return new Promise((resolve, reject) => {
			var newHash = crypto.randomBytes(20).toString('hex');
			var strData = JSON.stringify(profileData);
			connection.query("INSERT INTO profiles (hash, profileData, interactions) VALUES ('"+newHash+"', '"+strData+"', '{}')", function (error, results, fields) {
				if (error) reject(error);
				resolve(newHash);
			});
		});
	}
};

function query() {

}

var app = express();

app.use("/graphql", function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'access-control-allow-origin, Content-Type, Authorization, Content-Length, X-Requested-With');
	res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
	res.header('Access-Control-Allow-Credentials', true);
	if (req.method === 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
}, graphqlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');