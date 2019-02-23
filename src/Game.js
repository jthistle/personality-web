import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { InfoTable } from './InfoTable/InfoTable.js';
import './App.css';
import { Link } from 'react-router-dom';
import { QUERY_VARS } from './config.js';

class Game extends Component {
	constructor(props) {
		super(props);

		this.state = {
		}
	}

	componentDidMount() {
		
	}

	render() {
		return (
		<div id="MainWrapper">
		</div>
		);
	}
}

export default Game;