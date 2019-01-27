import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './Panel.css';

class PanelItem extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className={ "PanelItem" + (this.props.header ? " PanelHeader" : "") }>
				{ this.props.children }
			</div>
		);
	}
}

class Panel extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<div className="Panel">
					{ this.props.children }
				</div>
			</div>
		);
	}
}

export { Panel, PanelItem };