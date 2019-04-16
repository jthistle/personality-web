import React, { Component } from 'react';
import { HeaderItem } from '../HeaderItem/HeaderItem.js';
import { Button } from '../Button/Button.js'
import { LoggedIn } from '../LoggedIn/LoggedIn.js'
import { Highlight } from '../Highlight/Highlight.js'
import './Header.css';

class Header extends Component {
	constructor(props) {
		super(props);
	}

	isLoggedIn() {
		return !!localStorage.getItem("userHash");
	}

	getLoggedIn() {
		var userHash = localStorage.getItem("userHash");
		if (userHash) {
			return userHash;
		} else{
			return "Not logged in";
		}
	}

	render() {
		return (
			<div className="Header">
				<div className="Title">
					<Highlight>Personality</Highlight>
				</div>
				{
				this.isLoggedIn() ? (<HeaderItem>
					<Button className="HeaderItem" linkTo="dashboard" text="To Dashboard" />
				</HeaderItem>) :
				(<HeaderItem>
					<Button className="HeaderItem" linkTo="/" text="Homepage" />
				</HeaderItem>)
				}
				<HeaderItem>
					<Button className="HeaderItem" linkTo="about" text="About Personality" />
				</HeaderItem>
				<HeaderItem align="Right">
					<LoggedIn />
				</HeaderItem>
			</div>
		);
	}
}

export { Header };