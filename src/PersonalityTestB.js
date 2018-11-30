import React, { Component } from 'react';
import { QUERY_VARS } from './config.js';
import { Card } from './TestObjects/TestB/Card/Card.js'
import { Slider } from './TestObjects/TestB/Slider/Slider.js'
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Spacer } from './Spacer/Spacer.js';
import { Highlight } from './Highlight/Highlight.js';
import './App.css';
import { Redirect } from 'react-router-dom';

var descriptors = require("./descriptors.json");

class PersonalityTestB extends Component {
	constructor(props) {
		super(props);

		this.state = {
			responses: [],
			order: [],
			sliderValue: '50',
			redirect: false,
		}

		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.updateSliderValue = this.updateSliderValue.bind(this);
	}

	componentDidMount() {
		var savedResponses = JSON.parse(localStorage.getItem('testBResponses'));
		var savedOrder = JSON.parse(localStorage.getItem('testBOrder'));

		var numResponses = savedResponses ? savedResponses.length : 0;

		if (savedOrder && numResponses < descriptors.statements.length) {
			this.setState({
				responses: ( savedResponses ? savedResponses : [] ),
				order: savedOrder,
			});
		} else {
			var tempPos = [];
			descriptors.statements.forEach (function(item, ind) {
				tempPos.push(item.id);
			});

			tempPos = this.shuffle(tempPos);
			localStorage.setItem("testBOrder", JSON.stringify(tempPos));
			localStorage.setItem("testBResponses", JSON.stringify([]));

			this.setState({
				responses: [], // [...Array(29).keys()] // for testing only 
				order: tempPos,
			});
		}

		var selectedTest = localStorage.getItem("selectedTest");
		if (! selectedTest || selectedTest !== "testB") {
			this.setState({
				redirect: true,
			})
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

	getSliderDesc(){
		var positionTexts = descriptors.positions;

		var toPick = Math.floor((100-parseInt(this.state.sliderValue))/(100/positionTexts.length));

		if (toPick >= positionTexts.length)
			toPick = positionTexts.length-1

		return positionTexts[toPick];
	}

	getCard(){
		var onCard = this.state.responses.length;

		if (onCard >= descriptors.statements.length)
			return;

		var onDesc = descriptors.statements.find(x => x.id === this.state.order[onCard]);

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
				<div style={{ fontSize: "1.2rem" }}>{ this.getSliderDesc() }</div>
			</Card>
		);
	}

	handleMouseUp() {
		var tempResponses = this.state.responses;
		tempResponses.push(parseInt(this.state.sliderValue));
		this.setState({
			responses: tempResponses,
			sliderValue: "50",
		});

		localStorage.setItem("testBResponses", JSON.stringify(tempResponses));

		if (this.state.responses.length >= descriptors.statements.length) {
			this.saveChoices();
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
			var thisStatement = descriptors.statements.find(x => x.id === thisStatementId);

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
		var method = "b";
		var vars = {profileData, method}

		var query = `query CreateProfile($profileData: ProfileDataInput!, $method: String!){
			createProfile(profileData: $profileData, method: $method)
		}`; 

		fetch(QUERY_VARS.url, {
			method: QUERY_VARS.method,
			headers: QUERY_VARS.headers,
			body: JSON.stringify({
		    	query,
		    	variables: vars,
		  	})
		}).then(r => r.json())
			  .then(console.log("done"))
			  .then(data => { 
			  	localStorage.setItem("userHash", data.data.createProfile);
			  	this.setState({redirect: true});
			  	window.location.reload();
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
				<Spacer height="8" />
			</div>
		);
	}
}

export default PersonalityTestB;
