import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { InfoTable } from './InfoTable/InfoTable.js';
import { ChoiceItem } from './ChoiceItem/ChoiceItem.js';
import { ChatPanel } from './ChatPanel/ChatPanel.js';
import { OpinionView } from './OpinionView/OpinionView.js';
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
			userChoices: null,
			userIds: [],
			messages: [],
			userId: -1,
			messageOffset: 0,
			opinion: {},
			question: ""
		}

		this.colours = ["03b2fc", "18eb03", "E5F04C", "E23D75", "fc9f00"];
		this.codenames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];

		this.roundCount = 4;

		this.choiceClick = this.choiceClick.bind(this);
		this.chatPanelMessage = this.chatPanelMessage.bind(this);
		this.opinionCallback = this.opinionCallback.bind(this);
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
			userChoice: this.state.userChoice,
			offset: this.state.messageOffset
		}

		var query = `mutation GetGameDetails($hash: String!, $userChoice: Int!, $offset: Int!) {
			getGameDetails(hash: $hash, userChoice: $userChoice, offset: $offset) {
				gameStage
				userChoices
				coins
				stageStart
				userId
				messages {
					userId
					text
				}
				newOffset
				opinion {
					mostLiked
					leastLiked
				}
				question
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

			var coins = JSON.parse(gameDetails.coins);

			// Only update messages when necessary
			if (gameDetails.newOffset !== this.state.messageOffset) {
				this.setState({
					messages: this.state.messages.concat(gameDetails.messages),
				});
			}

			// Update other game details in state
	  		this.setState({
	  			gameStage: gameDetails.gameStage,
	  			stageStart: gameDetails.stageStart,
	  			coins: coins,
	  			messageOffset: gameDetails.newOffset,
  				userId: gameDetails.userId,
  				opinion: gameDetails.opinion,
  				question: gameDetails.question
	  		});

	  		if ("userChoices" in gameDetails) {
	  			this.setState({
	  				userChoices: JSON.parse(gameDetails.userChoices)
	  			});
	  		} else {
	  			this.setState({
	  				userChoices: null
	  			});
	  		}

	  		// Update user ids state for chat panel
	  		if (this.state.userIds.length === 0){
				var userIds = Object.keys(coins);
				this.setState({
					userIds: userIds
				});
			}
		}).catch(function(e) {
		    console.log("Error: " + e.message);
		});
	}

	sendMessage(message) {
		var vars = {
			hash: localStorage.getItem("userHash"),
			message: message
		}

		var query = `mutation SendMessage($hash: String!, $message: String!) {
			sendMessage(hash: $hash, message: $message)
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
			if (data.data.sendMessage === false) {
				console.log("Could not send, wait between messages.");
				return;
			}
			
			// Message successful, handle this
			var newMessages = this.state.messages.concat({ userId: this.state.userId, text: message.substring(0, 200) });
	  		this.setState({
	  			messages: newMessages,
	  			messageOffset: this.state.messageOffset + 1
	  		});
		}).catch(function(e) {
		    console.log("Error: " + e.message);
		});
	}

	chatPanelMessage(message) {
		this.sendMessage(message);
	}

	stageCountdown() {
		var roundTime;

		if (this.state.gameStage === 0) {
			var sortedIds = this.state.userIds.slice();	// duplicate array
			sortedIds.sort((a, b) => {
				return this.state.coins[b] - this.state.coins[a];
			});

			if (this.state.coins[sortedIds[0]] === this.state.coins[sortedIds[1]])
				return "It's a draw!";
			else {
				var id = sortedIds[0];
				var codeId = this.state.userIds.indexOf(id);
				var style = {
					color: "#" + this.colours[codeId],
					fontWeight: "bold"
				}
				return (
					<div><span style={ style }>{ this.codenames[codeId] }</span> has won!</div>
				);
			}

			return "Game has ended!";
		} else if (this.state.gameStage % 2 === 1)
			roundTime = 15;
		else
			roundTime = 45;

		var currentTime = Math.floor(Date.now() / 1000);
		return Math.max(0, roundTime - (currentTime - this.state.stageStart));
	}

	isLastPostRound() {
		return (Math.floor(this.state.gameStage / 2) === this.roundCount) && this.state.gameStage % 2 === 1;
	}

	stageName() {
		if (this.state.gameStage === 0)
			return "";
		else if (this.state.gameStage % 2 === 0)
			return "Round " + Math.ceil(this.state.gameStage / 2) + "/" + this.roundCount;
		else if (this.isLastPostRound())
			return "The final scores are in!";
		else if (this.state.gameStage % 2 === 1)
			return "Next: round " + Math.ceil(this.state.gameStage / 2) + "/" + this.roundCount;
	}

	coinTable() {
		var items = [];

		var userIds = this.state.userIds;
		var sortedIds = userIds.slice();	// duplicate array
		sortedIds.sort((a, b) => {
			return this.state.coins[b] - this.state.coins[a];
		});

		var place = 1;
		for (var user of sortedIds) {
			var id = userIds.indexOf(user);
			var colourStyle = { color: "#"+this.colours[id], fontWeight: "bold" };
			var codename = this.codenames[id];

			var choiceText = "";
			var choiceStyle = { fontWeight: "bold" }
			if (this.state.userChoices && this.state.gameStage !== 1) {
				var choice = this.state.userChoices[user];
				if (choice === 0) {
					choiceText = "Held";
				} else if (choice === 1) {
					choiceText = "Split";
				} else if (choice === 2) {
					choiceText = "Grabbed!";
					choiceStyle.color = "#D81E00";
				}
			}

			items.push(<tr key={ place } style={ { textAlign: "left" } }>
				<td style={ { fontWeight: "bold" } }>{ place }</td>
				<td style={ colourStyle }>{ codename } { this.state.userId == user ? "(you)" : "" }</td>
				<td>{ this.state.coins[user] }</td>
				<td style={ choiceStyle }>{ choiceText }</td>
				</tr>);
			place++;
		}

		return items;
	}

	choiceClick(choiceId) {
		this.setState({userChoice: choiceId});
	}

	getChoiceTable() {
		return (
			<InfoTable>
				<tr>
					<td><ChoiceItem hold selected={ this.state.userChoice === 0 } clickCallback={ this.choiceClick } /></td>
					<td><ChoiceItem split selected={ this.state.userChoice === 1 }  clickCallback={ this.choiceClick } /></td>
					<td><ChoiceItem grab selected={ this.state.userChoice === 2 }  clickCallback={ this.choiceClick } /></td>
				</tr>
			</InfoTable>
			);
	}

	// isMost is whether the choice is a 'most-liked' choice
	opinionCallback(userId, isMost) {
		var vars = {
			hash: localStorage.getItem("userHash"),
			mostLiked: isMost,
			userId: parseInt(userId)
		}

		var query = `mutation SendOpinion($hash: String!, $mostLiked: Boolean!, $userId: Int!) {
			sendOpinion(hash: $hash, mostLiked: $mostLiked, userId: $userId)
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
			if (data.data.sendOpinion) {
				var tempOpinion = this.state.opinion;

				if (isMost)
					tempOpinion.mostLiked = userId;
				else
					tempOpinion.leastLiked = userId;

				this.setState({
					opinion: tempOpinion
				});
			}
		});
	}


	render() {
		return (
		<div id="MainWrapper">
			<div>
				<Heading>{ this.stageCountdown() }</Heading>
				<Text big>{ this.stageName() }</Text>
				<Spacer height="0.5" />
				{ 
					this.isLastPostRound() || this.state.gameStage === 0 ? 
						<OpinionView codenames={ this.codenames } colours={ this.colours } userIds={ this.state.userIds }
							userId={ this.state.userId } opinionCallback={ this.opinionCallback } opinion={ this.state.opinion } />
						: this.getChoiceTable() 
				}
				<Spacer height="1" />
				<Text big>Coins - jackpot <Highlight>{ this.state.userIds.length * 200 }</Highlight></Text>
				<Spacer height="0.1" />
				<InfoTable>
					{ this.coinTable() }
				</InfoTable>
			</div>
			<div>
				<ChatPanel codenames={ this.codenames } colours={ this.colours } userIds={ this.state.userIds } thisUserId={ this.state.userId }
					ref={ this.chatPanel } messages={ this.state.messages } messageCallback={ this.chatPanelMessage } question={ this.state.question } />
			</div>
		</div>
		);
	}
}

export default Game;