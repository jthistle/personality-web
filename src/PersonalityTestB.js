import React, { Component } from 'react';
import { Header, Button, Heading, Text, Highlight, Spacer } from './objects';
import { Card, Slider } from './testObjectsB';
import './App.css';
import { Link, Redirect } from 'react-router-dom';

var descriptors = require("./descriptors.json");

class PersonalityTestB extends Component {
	constructor(props) {
		super(props);

		this.state = {
			responses: Array(),
			order: Array(),
			sliderValue: '50',
			redirect: false,
		}

		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.updateSliderValue = this.updateSliderValue.bind(this);
	}

	componentDidMount() {
		var savedResponses = JSON.parse(localStorage.getItem('testBResponses'));
		var savedOrder = JSON.parse(localStorage.getItem('testBOrder'));

		if (savedOrder && false) {
			this.setState({
				responses: ( savedResponses ? savedResponses : Array() ),
				order: savedOrder,
			});
		} else {
			var tempPos = Array();
			descriptors.statements.forEach (function(item, ind) {
				tempPos.push(item.id);
			});

			tempPos = this.shuffle(tempPos);
			localStorage.setItem("testBOrder", JSON.stringify(tempPos));

			this.setState({
				responses: Array(), // [...Array(29).keys()] // for testing only 
				order: tempPos,
			});
		}		
	}

	shuffle(array) {
		var m = array.length, t, i;

		// While there remain elements to shuffle…
		while (m) {

			// Pick a remaining element…
			i = Math.floor(Math.random() * m--);

			// And swap it with the current element.
			t = array[m];
			array[m] = array[i];
			array[i] = t;
		}

		return array;
	}

	getCard(){
		var onCard = this.state.responses.length;

		if (onCard >= descriptors.statements.length)
			return;

		var onDesc = descriptors.statements.find(x => x.id == this.state.order[onCard]);

		// I have absolutely no idea why, but onDesc can't be accessed without throwing
		// a TypeError: undefined. So, instead just recreate the object :/
		var newObj = {};
		for (var key in onDesc){
			newObj[key] = onDesc[key];
		}

		return (
			<Card>
				<div>
					{  newObj.text }
				</div>
				<Slider handleMouseUp={ this.handleMouseUp } updateSliderValue={ this.updateSliderValue } />
			</Card>
		);
	}

	handleMouseUp() {
		var tempResponses = this.state.responses;
		tempResponses.push(parseInt(this.state.sliderValue));
		this.setState({
			responses: tempResponses,
		});

		localStorage.setItem("testBResponses", JSON.stringify(tempResponses));

		if (this.state.responses.length >= descriptors.statements.length) {
			this.saveChoices();
			// TODO and move on
		}
	}

	updateSliderValue(val) {
		this.setState({
			sliderValue: val,
		})
	}

	saveChoices(){
		if (this.state.redirect)
			return;

		// First, map responses to their respective attributes
		var responsesByAttr = {
			o: [],
			c: [],
			e: [],
			a: [],
			n: []
		}

		var order = this.state.order;

		this.state.responses.forEach(function(resp, ind){
			var thisStatementId = order[ind];
			var thisStatement = descriptors.statements.find(x => x.id == thisStatementId);

			responsesByAttr[thisStatement.factor].push(resp/100);
		});

		// Now average out response scores
		var scores = {
			o: 0,
			c: 0,
			e: 0,
			a: 0,
			n: 0
		}

		for (var ind in responsesByAttr){
			var resps = responsesByAttr[ind];
			scores[ind] = resps.reduce((a, b) => a + b, 0)/resps.length;
		}

		console.log(scores);

		var profileData = scores;
		var query = `query CreateProfile($profileData: ProfileDataInput!){
			createProfile(profileData: $profileData)
		}`; 

		fetch('http://localhost:4000/graphql', {
			  method: 'POST',
			  headers: {
			    'Content-Type': 'application/json',
			    'Accept': 'application/json',
			    'Access-Control-Allow-Origin': '*',
			  },
			  body: JSON.stringify({
			    query,
			    variables: { profileData },
			  })
			}).then(r => r.json())
			  .then(console.log("done"))
			  .then(data => { 
			  	localStorage.setItem("userHash", data.data.createProfile);
			  	this.setState({redirect: true});
			   });

		return;
	}

	render() {
		return (
			<div id="MainWrapper">
				{ this.state.redirect || localStorage.getItem("userHash") ? <Redirect to="/" /> : "" }
				<Heading>It's simple</Heading>
				<Text big>
					Slide the slider for each statement from<br />
					<Highlight>"least describes me"</Highlight> to <Highlight>"most describes me"</Highlight>
				</Text>
				<div className="CardBWrapper">
					{
						this.getCard()
					}
				</div>
				<Spacer height="1" />
			</div>
		);
	}
}

export default PersonalityTestB;
