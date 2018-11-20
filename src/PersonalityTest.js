import React, { Component } from 'react';
import { Header, Button, Heading, Text, Highlight } from './objects';
import { Card } from './testObjects';
import './App.css';
import { Link } from 'react-router-dom';



class PersonalityTest extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>It's simple</Heading>
				<Text big>Arrange the cards in order, from <br /><Highlight>"most describes me"</Highlight> to <Highlight>"least describes me"</Highlight></Text>
			
				<div className="CardContainter">
					<Card>I am talkative</Card>
				</div>
			</div>
		);
	}
}

export default PersonalityTest;
