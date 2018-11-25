import React, { Component } from 'react';
import { Header, Button, Heading, Highlight, Text, Spacer } from './objects';
import './App.css';
import { Link } from 'react-router-dom';



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
		// localStorage.removeItem("selectedTest");
		this.whichTest = "testB";
		localStorage.setItem("selectedTest", this.whichTest);
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>Contribute to <Highlight>new</Highlight> research into personality</Heading>
				<Spacer height="2" />
				<Button big linkTo={ this.whichTest }>Take the quick personality test</Button>
				<Spacer height="2" />
				<Text big>Got an account already? Login in the top-right corner</Text>
				<Spacer height="2" />
			</div>
		);
	}
}

export default Home;
