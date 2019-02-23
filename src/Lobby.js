import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { InfoTable } from './InfoTable/InfoTable.js';
import './App.css';
import { QUERY_VARS } from './config.js';

class Lobby extends Component {
	constructor(props) {
		super(props);

		this.toggleWaiting = this.toggleWaiting.bind(this);

		this.state = {
			waitingCount: 0,
			isWaiting: false
		}
	}

	componentDidMount() {
		setInterval(this.queryWaiting.bind(this), 1000);
	}

	queryWaiting() {
		var query = `query GetWaitingCount {
			getWaitingCount
		}`; 

		fetch(QUERY_VARS.url, {
			method: QUERY_VARS.method,
			headers: QUERY_VARS.headers,
			body: JSON.stringify({
		    	query
		  	})
		}).then(r => r.json())
		  .then(data => { 
		  	this.setState({ waitingCount: data.data.getWaitingCount });
		   });
	}

	getWaitingCount() {
		return <div>{ this.state.waitingCount } people waiting</div>;
	}

	getButton() {
		if (this.state.isWaiting) {
			return (
				<Button big active cancel onClick={ this.toggleWaiting }>
					Searching...
				</Button>
			);
		} else {
			return (
				<Button big makeactive onClick = { this.toggleWaiting }>
					Join the queue
				</Button>
			);
		}
	}

	toggleWaiting() {
		var query = `query SetWaiting($hash: String!, $isWaiting: Boolean!){
			setWaiting(hash: $hash, isWaiting: $isWaiting)
		}`;

		var vars = {
			hash: localStorage.getItem("userHash"),
			isWaiting: !this.state.isWaiting
		}

		fetch(QUERY_VARS.url, {
			method: QUERY_VARS.method,
			headers: QUERY_VARS.headers,
			body: JSON.stringify({
		    	query,
		    	variables: vars
		  	})
		}).then(r => r.json())
		  .then(data => {
		  	if (data.data.setWaiting === true)
				this.setState({isWaiting: !this.state.isWaiting});
		   });
	}

	render() {
		return (
		<div id="MainWrapper">
			{ this.getButton() }
			<span>{ this.getWaitingCount() }</span>
			<div>
				<Text big>Here's how it works: </Text>
				<p>You have <Highlight>100</Highlight> coins.<br />
				However, there is a jackpot of <Highlight>600 - 1000</Highlight> coins.<br />
				Your options are: </p>
				<InfoTable>
					<tr>
						<td><img src={ require("./resources/holdDefault.svg") } /></td>
						<td><img src={ require("./resources/splitDefault.svg") } /></td>
						<td><img src={ require("./resources/grabDefault.svg") } /></td>
					</tr><tr>
						<td><b>Hold</b> - keep your starting coins</td>
						<td><b>Split</b> - split the jackpot with anyone else who chooses this option</td>
						<td><b>Grab</b> - take the jackpot for yourself, splitters get nothing.</td>
					</tr>
				</InfoTable>
				<p>But be warned: if two or more people <b>grab</b>, the people grabbing get <Highlight>nothing</Highlight>, and splitters still split the jackpot.</p>
			</div>
		</div>
		);
	}
}

export default Lobby;