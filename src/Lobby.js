import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { InfoTable } from './InfoTable/InfoTable.js';
import { Spacer } from './Spacer/Spacer.js';
import './App.css';
import { QUERY_VARS } from './config.js';

//
// The lobby is where a user can request that they be put into a game session
// with other users.
//
class Lobby extends Component {
	constructor(props) {
		super(props);

		this.cancelWaiting = this.cancelWaiting.bind(this);
		this.setWaiting    = this.setWaiting.bind(this);

		this.state = {
			waitingCount: 0,
			isWaiting: false,
			waitingTimer: null
		}
	}

	componentDidMount() {
		this.setState({
			waitingTimer: setInterval(this.queryWaiting.bind(this), 1000)
		});
	}

	componentWillUnmount() {
		clearInterval(this.state.waitingTimer);
	}

	//
	// Query waiting updates the counter for the number of people waiting based on the
	// value returned from the API. This is queried once a second. It also keeps the
	// waiting value for this user fresh.
	//
	queryWaiting() {
		this.setState({ haveResponse: false });

		var query;
		var vars = {};

		if (this.state.isWaiting) {
			query = `query GetUpdateWaitingCount($hash: String!, $isWaiting: Boolean!) {
				getWaitingCount
				setWaiting(hash: $hash, isWaiting: $isWaiting)
			}`;
			
			vars = {
				hash: localStorage.getItem("userHash"),
				isWaiting: true
			}
		} else {
			query = `query GetWaitingCount {
				getWaitingCount
			}`;
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
		  	this.setState({ waitingCount: data.data.getWaitingCount });
		  	if (this.state.isWaiting) {
		  		if (data.data.setWaiting !== true)
					this.setState({ isWaiting: false });
		  	}
		   }).catch(function(e) {
			    console.log("Error" + e.message);
			});
	}

	getWaitingCount() {
		return <div>{ this.state.waitingCount } people waiting</div>;
	}

	getButton() {
		if (this.state.isWaiting) {
			return (
				<Button big active cancel onClick={ this.cancelWaiting }>
					Searching...
				</Button>
			);
		} else {
			return (
				<Button big makeactive onClick = { this.setWaiting }>
					Join the queue
				</Button>
			);
		}
	}

	// 
	// Set waiting and cancel waiting are used to explicitally set the user's waiting status.
	// If this isn't updated for more than 2 seconds, the waiting status becomes invalid. 
	// MakeWaitingRequest is used to actually send the request to the API. To keep it fresh,
	// the setWaiting query is sent along with getWaitingCount to reduce server load.
	//
	setWaiting() {
		this.makeWaitingRequest(true);
	}

	cancelWaiting() {
		this.makeWaitingRequest(false);
	}

	makeWaitingRequest(val) {
		var query = `query SetWaiting($hash: String!, $isWaiting: Boolean!){
			setWaiting(hash: $hash, isWaiting: $isWaiting)
		}`;

		var vars = {
			hash: localStorage.getItem("userHash"),
			isWaiting: val
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
				this.setState({ isWaiting: val });
		   })
		   .catch(function(e) {
			console.log("Error" + e.message);
		    });
	}

	render() {
		return (
		<div id="MainWrapper">
			{ this.getButton() }
			<span>{ this.getWaitingCount() }</span>
			<Spacer height="1" />
			<div>
				<Text big>Here's how it works: </Text>
				<p>You have <Highlight>100</Highlight> coins.<br />
				However, there is a jackpot of <Highlight>600 - 1000</Highlight> coins.<br />
				Your options are: </p>
				<InfoTable>
					<tr>
						<td><img src={ require("./resources/holdDefault.svg") } alt="Hold icon" /></td>
						<td><img src={ require("./resources/splitDefault.svg") } alt="Split icon" /></td>
						<td><img src={ require("./resources/grabDefault.svg") } alt="Grab icon"/></td>
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