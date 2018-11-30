import React, { Component } from 'react';
import './Text.css';

class Text extends Component {
	render() {
		return (
			<div className={ (this.props.big ? " BigText" : "") + (this.props.subtle ? " SubtleText" : "") }>
				{ this.props.children }
			</div>
		);
	}
}

export { Text };