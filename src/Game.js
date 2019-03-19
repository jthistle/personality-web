import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { InfoTable } from './InfoTable/InfoTable.js';
import { ChoiceItem } from './ChoiceItem/ChoiceItem.js';
import { Spacer } from './Spacer/Spacer.js';
import './App.css';
import { Link } from 'react-router-dom';
import { QUERY_VARS } from './config.js';

class Game extends Component {
	constructor(props) {
		super(props);

		this.state = {
			userChoice: 0,
			stageStart: Math.floor(Date.now() / 1000),
			gameDetailsTimer: null,
			coins: {},
			userId: 0
		}

		this.colours = ["03b2fc", "18eb03", "e02400", "ce059d", "fc9f00"];
		this.codenames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];

		this.roundCount = 2;

		this.choiceClick = this.choiceClick.bind(this);
	}

	componentDidMount() {
		this.getGameDetails();
		this.setState({
			gameDetailsTimer: setInterval(this.getGameDetails.bind(this), 1000)
		})
	}

	componentWillUnmount() {
		clearInterval(this.state.gameDetailsTimer);
	}

	getGameDetails() {
		var vars = {
			hash: localStorage.getItem("userHash"),
			userChoice: this.state.userChoice
		}

		var query = `mutation GetGameDetails($hash: String!, $userChoice: Int!) {
			getGameDetails(hash: $hash, userChoice: $userChoice) {
				gameStage
				userChoices
				coins
				stageStart
				userId
			}
		}`;

		fetch(QUERY_VARS.url, {
			method: QUERY_VARS.method,
			headers: QUERY_VARS.headers,
			body: JSON.stringify({
		    	query,
		    	variables: vars
		  	})
		})
		.then(r => r.json())
		.then(data => { 
			var gameDetails = data.data.getGameDetails;
	  		this.setState({
	  			gameStage: gameDetails.gameStage,
	  			stageStart: gameDetails.stageStart,
	  			coins: JSON.parse(gameDetails.coins),
	  			userId: gameDetails.userId
	  		});
		}).catch(function(e) {
		    console.log("Error" + e.message);
		});
	}

	stageCountdown() {
		var roundTime;

		if (this.state.gameStage === 0)
			return "Game has ended!";
		else if (this.state.gameStage % 2 === 1)
			roundTime = 15;
		else
			roundTime = 45;

		var currentTime = Math.floor(Date.now() / 1000);
		return Math.max(0, roundTime - (currentTime - this.state.stageStart));
	}

	stageName() {
		if (this.state.gameStage === 0)
			return "";
		else if (this.state.gameStage % 2 === 0)
			return "Round " + Math.ceil(this.state.gameStage / 2);
		else if (Math.floor(this.state.gameStage / 2) === this.roundCount)
			return "The final scores are in!";
		else if (this.state.gameStage % 2 === 1)
			return "Next: round " + Math.ceil(this.state.gameStage / 2);
	}

	coinTable() {
		var items = [];

		var unsortedIds = Object.keys(this.state.coins);
		var userIds = Object.keys(this.state.coins);

		userIds.sort((a, b) => {
			return this.state.coins[b] - this.state.coins[a];
		});

		for (var user of userIds) {
			var id = unsortedIds.indexOf(user);
			var colourStyle = { color: "#"+this.colours[id], fontWeight: "bold" };
			var codename = this.codenames[id];
			items.push(<tr>
				<td><span style={ colourStyle }>{ codename } { this.state.userId == user ? "(you)" : "" }</span></td>
				<td>{ this.state.coins[user] }</td>
				</tr>);
			id++;
		}

		return items;
	}

	choiceClick(choiceId) {
		this.setState({userChoice: choiceId});
	}

	render() {
		return (
		<div id="MainWrapper">
			<Heading>{ this.stageCountdown() }</Heading>
			<Text big>{ this.stageName() }</Text>
			<Spacer height="0.5" />
			<InfoTable>
				<tr>
					<td><ChoiceItem hold selected={ this.state.userChoice === 0 } clickCallback={ this.choiceClick } /></td>
					<td><ChoiceItem split selected={ this.state.userChoice === 1 }  clickCallback={ this.choiceClick } /></td>
					<td><ChoiceItem grab selected={ this.state.userChoice === 2 }  clickCallback={ this.choiceClick } /></td>
				</tr>
			</InfoTable>
			<Spacer height="1" />
			<Text big>Coins</Text>
			<Spacer height="0.1" />
			<InfoTable>
				{ this.coinTable() }
			</InfoTable>
		</div>
		);
	}
}

export default Game;