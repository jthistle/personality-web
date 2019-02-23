/*const dbPwd = require('./secrets.js');*/

var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');
var mysql			= require('mysql');
var sanitizer = require('sanitize')();

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
		profile(hash: String!): Profile,
		createProfile(profileData: ProfileDataInput!, method: String!): String,
		setWaiting(hash: String!, isWaiting: Boolean!): Boolean,
		getWaitingCount: Int
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

var cachedWaitingTime = 0;
var cachedWaiting = 0;

// interval in seconds between waiting count updates
var cachedWaitingInterval = 1;

// The root provides a resolver function for each API endpoint
var root = {
	hello: () => {
		return 'Hello world!';
	},

	profile: ({hash}) => {
		return new Promise((resolve, reject) => {
			//hash = sanitizer.value(hash, "string");

			connection.query("SELECT * FROM profiles WHERE hash='"+hash+"' LIMIT 1", function (error, results, fields) {
				if (error) {
					reject(error);
					return;
				}

				if (results.length == 0) {
					reject("Profile not found");
				} else {	
					console.log('Profile 1: ', results[0]);
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
			//strData = sanitizer.value(strData, "string");
			//method = sanitizer.value(method, "string");

			connection.query("INSERT INTO profiles (hash, profileData, method, interactions) VALUES ('"+newHash+"', '"+strData+"', '"+method+"', '{}');", function (error, results, fields) {
				if (error) 
					reject(error);
				else
					resolve(newHash);
			});
		});
	},

	setWaiting: ({hash, isWaiting}) => {
		return new Promise((resolve, reject) => {
			var value = isWaiting ? 1 : 0;
			//hash = sanitizer.value(hash, "string");

			connection.query("UPDATE profiles SET isWaiting="+value+" WHERE hash='"+hash+"';", function (error, results, fields) {
				if (error) 
					reject(error);
				else
					resolve(true);
			});
		});
	},

	getWaitingCount: () => {
		return new Promise((resolve, reject) => {
			var currentTime = Date.now() / 1000;

			if (cachedWaitingTime + cachedWaitingInterval > currentTime)
				return cachedWaiting;

			connection.query("SELECT COUNT(*) FROM profiles WHERE isWaiting=1;", function (error, results, fields) {
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