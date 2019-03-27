import React, { Component } from 'react';
import './OpinionView.css';

class UserOption extends Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick() {
		this.props.clickCallback(this.props.userId, this.props.isMost);
	}

	render() {
		return (
			<div onClick={ this.handleClick } className={ "UserOption" + (this.props.selected ? " Selected" : "") } style={ this.props.style }>
				{ this.props.codename }
			</div>
			);
	}
}

class OpinionView extends Component {
	constructor(props) {
		super(props);

		// We have opinionCallback as a prop to use when a click has been made
	}

	getUsers(isMost) {
		var otherUsers = [];

		for (var user of this.props.userIds) {
			var id = this.props.userIds.indexOf(user);
			if (user == this.props.userId)
				continue;

			var selected = false;
			if (this.props.userId in this.props.opinions) {
				var userOpinions = this.props.opinions[this.props.userId];
				if (isMost && "mostLiked" in userOpinions)
					selected = (user == userOpinions.mostLiked);
				else if (!isMost && "leastLiked" in userOpinions)
					selected = (user == userOpinions.leastLiked);
			}

			var colourStyle = { color: "#"+this.props.colours[id] };
			var codename = this.props.codenames[id];
			otherUsers.push(<UserOption isMost={ isMost } codename={ codename } userId={ user }
				style={ colourStyle } clickCallback={ this.props.opinionCallback } key={ user }
				selected={ selected } />);
		}

		return otherUsers;
	}

	render() {
		return (
			<div className="OpinionView">
				<div><div>I most liked...</div> { this.getUsers(true) }</div>
				<div><div>I least liked...</div> { this.getUsers(false) }</div>
			</div>
		);
	}
}

export { OpinionView };