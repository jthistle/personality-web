import React, { Component } from 'react';
import './ChatPanel.css';

class ChatPanel extends Component {
	constructor(props) {
		super(props);

		this.inputKeyPress = this.inputKeyPress.bind(this);
		this.messageInput = React.createRef();
		this.chatMessages = React.createRef();
	}

	componentDidUpdate(prevProps) {
		// Scroll to bottom of chat if there are new messages
		if (prevProps.messages.length < this.props.messages.length) {
			this.chatMessages.current.scrollTop = this.chatMessages.current.scrollHeight;
		}
	}

	inputKeyPress(event) {
		if (event.key !== "Enter")
			return;

		this.props.messageCallback(this.messageInput.current.value);
		this.messageInput.current.value = "";
	}

	getMessages() {
		if (!this.props.messages)
			return (<div className="ChatItem">Loading...</div>);
		else if (this.props.messages.length === 0)
			return (<div className="ChatItem">Be the first to say something!</div>);

		var tempMessages = [];
		var i = 0;
		for (var m of this.props.messages) {
			var id = this.props.userIds.indexOf(m.userId.toString());
			var colourStyle = { color: "#"+this.props.colours[id]};
			var username = (m.userId == this.props.thisUserId) ? "You" : this.props.codenames[id];

			tempMessages.push(<div key={ i } className="ChatItem">
				<span style={ colourStyle }>{ username }: </span>
					{ m.text }
				</div>);
			i++;
		}

		return tempMessages;
	}

	render() {
		return (
			<div className="ChatPanel">
				<div className="ChatItem ChatHeader">Q: { this.props.question }</div>
					<div className="ChatMessages" ref={ this.chatMessages }>
					{
						this.getMessages()
					}
					<div ></div>
					</div>
				<input ref={ this.messageInput } placeholder="Enter message..." className="ChatItem ChatInput" onKeyPress={ this.inputKeyPress }></input>
			</div>
		);
	}
}

export { ChatPanel };