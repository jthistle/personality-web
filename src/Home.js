import React, { Component } from 'react';
import { Header, Button } from './objects';
import './App.css';

class Home extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="App">
				<Header />
			</div>
		)
	}
}

export default Home;
