// This remains as an example of how to integrate React and GraphQL

import React, { Component } from 'react';
import { Header, Button } from './objects';
import './App.css';
import { Link } from 'react-router-dom';

class DiceList extends Component {
	constructor(props) {
		super(props);

		console.log("vals:",this.props.diceVals)
	}
	
	renderDice() {
		var i = 0
		return this.props.diceVals.map(d => 
						<li key={ ++i }>Dice: {d}</li>
						);
	}

  	render() {
		return (
			<div id="DiceList">
				<ul>
					{ this.renderDice() }
				</ul>
			</div>);
	}
}

class Dice extends Component {
	constructor(props) {
		super(props);

		this.state = {dice: ["Loading", "Loading"]};

		this.reroll = this.reroll.bind(this);

		this.reroll();
	}

	rollDice() {
		var dice = 2;
		var sides = 6;
		var query = `query RollDice($dice: Int!, $sides: Int) {
		  rollDice(numDice: $dice, numSides: $sides)
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
			    variables: { dice, sides },
			  })
			}).then(r => r.json())
			  .then(console.log("done"))
			  .then(data => { console.log(data.data.rollDice); this.setState({dice: data.data.rollDice});});
	}

	reroll(){
		console.log("yes");
		this.rollDice();
	}

	render() {
		return (
			<div id="MainWrapper">
				<Button onClick={this.reroll} text="Roll Dice" />
				<DiceList diceVals={this.state.dice} />
			</div>
		)
	}
}

export default Dice;