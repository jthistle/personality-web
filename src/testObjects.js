import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Text, Highlight } from "./objects";

class Card extends Component {
	render() {
		return (
			<div className="Card" id={ this.props.id }>
				{ this.props.children }
			</div>
		);
	}
} 


export { Card };