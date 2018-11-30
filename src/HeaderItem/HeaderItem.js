import React, { Component } from 'react';
import './HeaderItem.css';

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

export { HeaderItem };