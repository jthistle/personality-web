import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Spacer } from './Spacer/Spacer.js'; 
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import './App.css';

class Home extends Component {
	constructor(props) {
		super(props);
		
		
		var selectedTest = localStorage.getItem("selectedTest");

		if (selectedTest){
			this.whichTest = selectedTest;
		} else {
			this.whichTest = (Math.random() >= 0.5 ? "test" : "testB");
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
				<Heading>Contribute to <Highlight>new</Highlight> research into personality</Heading>
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
