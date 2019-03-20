import React, { Component } from 'react';
import './ChatPanel.css';

class ChatPanel extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div class="ChatPanel">
				<div class="ChatItem">Chat</div>
				<div class="ChatItem">This is a chat item, it is like this</div>
				<div class="ChatItem">Lorem ipsum dolar sit amet, constructor something etc. etc., this is quite
				long actually bladdy shambles etc. etc. ad hoc ad hic ad ab eram eras erat eramus eratis erant</div>
				<input placeholder="Enter message..." class="ChatItem ChatInput"></input>
			</div>
		);
	}
}

export { ChatPanel };