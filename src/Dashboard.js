import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Spacer } from './Spacer/Spacer.js'; 
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import './App.css';
import { Link } from 'react-router-dom';

class Dashboard extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			waiting: false,
		}
	}

	toggleWaiting(){
		return;
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>Talk to <Highlight>other people</Highlight></Heading>
				<Spacer height="1" />
				<Text>After you finish talking you'll be given the opportunity to 
				say who you liked the most and who you disliked the most.</Text>
				<Spacer height="1" />
				<Button big>Join the queue</Button>
			</div>
		);
	}
}

export default Dashboard;
