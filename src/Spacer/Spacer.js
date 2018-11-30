import React, { Component } from 'react';

class Spacer extends Component {
	render() {
		return (
			<div style={ {width: "100%", display: "block", height: this.props.height.toString()+"rem"} }>
				{ this.props.children }
			</div>
		);
	}
}

export { Spacer };