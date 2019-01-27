import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Spacer } from './Spacer/Spacer.js'; 
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { Redirect } from 'react-router-dom';
import './App.css';

class Home extends Component {
	constructor(props) {
		super(props);
		
		var selectedTest = localStorage.getItem("selectedTest");

		if (selectedTest){
			this.whichTest = selectedTest;
		} else {
			// Test B seems to be better than Test A, so use it more often
			this.whichTest = (Math.random() >= 0.75 ? "test" : "testB");
			localStorage.setItem("selectedTest", this.whichTest)
		}

		// DEBUG: force a certain test
		// localStorage.removeItem("selectedTest")
		// this.whichTest = "test";
		// localStorage.setItem("selectedTest", this.whichTest);
	}

	render() {
		return (
			<div id="MainWrapper">
				{ localStorage.getItem("userHash") ? <Redirect to="/dashboard" /> : "" }
				<Heading>Find out about <Highlight>yourself</Highlight></Heading>
				<Text big>and contribute to <Highlight>new</Highlight> research into personality</Text>
				<Spacer height="2" />
				<Button big linkTo={ this.whichTest }>Take the quick personality test</Button>
				<Spacer height="2" />
				<Text big>Got a profile already? Login in the top-right corner</Text>
				<Spacer height="2" />
			</div>
		);
	}
}

export default Home;
