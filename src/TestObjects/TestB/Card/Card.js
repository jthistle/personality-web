import React, { Component } from 'react';
import './Card.css';

class Card extends Component {
	render() {
		return (
			<div className="CardB">
				{ this.props.children }
			</div>
		);
	}
}

export { Card };