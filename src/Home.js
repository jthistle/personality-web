import React, { Component } from 'react';
import { Header, Button, Heading, Highlight } from './objects';
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

	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>Contribute to <Highlight>new</Highlight> research into personality</Heading>
				<Button big linkTo={ this.whichTest }>Take the quick personality test</Button>
			</div>
		);
	}
}

export default Home;
