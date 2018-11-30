import React, { Component } from 'react';
import './Highlight.css';

class Highlight extends Component {
	render() {
		return (
			<div className="Highlight">
				{ this.props.children }
			</div>
		);
	}
} 

export { Highlight };