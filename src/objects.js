import React, { Component } from 'react';

class Button extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="Button" onClick={this.props.onClick}>
				Test button
			</div>
		);
	}
}

function Title() {
	return (
		<div id="Title">
			Personality
		</div>
	);
}

class Header extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="Header">
				<Title />
			</div>
		);
	}
}


export { Header, Button };
export default Header;