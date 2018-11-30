import React, { Component } from 'react';
import './Heading.css';

class Heading extends Component {
	render() {
		return (
			<div className="Heading">
				{ this.props.children }
			</div>
		);
	}
}

export { Heading };