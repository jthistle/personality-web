import React, { Component } from 'react';
import { Header, Button, Heading, Highlight, Text, Spacer } from './objects';
import './App.css';
import { Link } from 'react-router-dom';



class Dashboard extends Component {
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
		this.whichTest = "testB";
		localStorage.setItem("selectedTest", this.whichTest);
	}

	render() {
		return (
			<div id="MainWrapper">
				<Text big>Dashboard</Text>
			</div>
		);
	}
}

export default Dashboard;
