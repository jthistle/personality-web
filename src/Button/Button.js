import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

class Button extends Component {
	constructor(props) {
		super(props);
	}

	content() {
		return (
			<div className={ 
				"Button"+ (this.props.big ? " BigButton" : "") +
				(this.props.active && this.props.cancel ? " ActiveCancelButton" : "") +
				(this.props.active && !this.props.cancel ? " ActiveButton" : "") +
				(this.props.makeactive ? " MakeActiveButton" : "")
				} onClick={this.props.onClick}>
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

export { Button };