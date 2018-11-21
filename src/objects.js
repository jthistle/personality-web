import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Heading extends Component {
	render() {
		return (
			<div className="Heading">
				{ this.props.children }
			</div>
		);
	}
}

class Text extends Component {
	render() {
		return (
			<div className={ (this.props.big ? " BigText" : "") + (this.props.subtle ? " SubtleText" : "") }>
				{ this.props.children }
			</div>
		);
	}
}

class Highlight extends Component {
	render() {
		return (
			<div className="Highlight">
				{ this.props.children }
			</div>
		);
	}
} 

class Button extends Component {
	constructor(props) {
		super(props);
	}

	content() {
		return (
			<div className={ "Button"+ (this.props.big ? " BigButton" : "") } onClick={this.props.onClick}>
				{ this.props.text }
				{ this.props.children }
			</div>
		);
	}

	render() {
		return (
			<div>
			{ 
				this.props.linkTo ? 
				<Link to={ this.props.linkTo }>{ this.content() }</Link> 
				: <div> { this.content() } </div>
			}
			</div>
		);
	}
}

function Title() {
	return (
		<div className="Title">
			<Highlight>Personality</Highlight>
		</div>
	);
}

class HeaderItem extends Component {
	constructor(props) {
		super(props);
	}

	alignClass() {
		return "HeaderItem HeaderItem"+this.props.align;
	}

	render() {
		return (
			<div className={ this.alignClass() }>
				{ this.props.text }
				{ this.props.children }
			</div>
		);
	}
}

class Header extends Component {
	constructor(props) {
		super(props);
	}

	getLoggedIn() {
		var userHash = localStorage.getItem('userHash');
		if (userHash) {
			return userHash;
		} else{
			return "Not logged in";
		}
	}

	render() {
		return (
			<div className="Header">
				<Title />
				<HeaderItem>
					<Button className="HeaderItem" linkTo="/" text="To Home" />
				</HeaderItem>
				<HeaderItem>
					<Button className="HeaderItem" linkTo="dice" text="To Dice" />
				</HeaderItem>
				<HeaderItem align="Right" text={ this.getLoggedIn() } />
			</div>
		);
	}
}


export { Header, Button, Heading, Text, Highlight };
export default Header;