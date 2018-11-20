import React, { Component } from 'react';
import { Header, Button, Heading, Highlight } from './objects';
import './App.css';
import { Link } from 'react-router-dom';



class Home extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>Contribute to <Highlight>new</Highlight> research into personality</Heading>
				<Button big linkTo="test">Take the quick personality test</Button>
			</div>
		);
	}
}

export default Home;
