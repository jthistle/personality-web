import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { InfoTable } from './InfoTable/InfoTable.js';
import { ChoiceItem } from './ChoiceItem/ChoiceItem.js';
import './App.css';
import { Link } from 'react-router-dom';
import { QUERY_VARS } from './config.js';

class Game extends Component {
	constructor(props) {
		super(props);

		this.state = {
			userChoice: 0,
			stageStart: Math.floor(Date.now() / 1000),
			gameDetailsTimer: null
		}

		this.choiceClick = this.choiceClick.bind(this);
	}

	componentDidMount() {
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
	  			stageStart: gameDetails.stageStart
	  		});
		}).catch(function(e) {
		    console.log("Error" + e.message);
		});
	}

	stageCountdown() {
		var currentTime = Math.floor(Date.now() / 1000);
		return currentTime - this.state.stageStart;
	}

	choiceClick(choiceId) {
		this.setState({userChoice: choiceId});
	}

	render() {
		return (
		<div id="MainWrapper">
			<Heading>{ this.stageCountdown() }</Heading>
			<InfoTable>
				<tr>
					<td><ChoiceItem hold selected={ this.state.userChoice === 0 } clickCallback={ this.choiceClick } /></td>
					<td><ChoiceItem split selected={ this.state.userChoice === 1 }  clickCallback={ this.choiceClick } /></td>
					<td><ChoiceItem grab selected={ this.state.userChoice === 2 }  clickCallback={ this.choiceClick } /></td>
				</tr>
			</InfoTable>
		</div>
		);
	}
}

export default Game;