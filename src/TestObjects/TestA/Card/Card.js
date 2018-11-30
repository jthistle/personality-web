import React, { Component } from 'react';
import { Text } from '../../../Text/Text.js';
import { Spacer } from '../../../Spacer/Spacer.js';
import 'array.prototype.move';
import { Draggable } from 'react-beautiful-dnd';
import './Card.css';

var descriptors = require("../../../descriptors.json");

class Card extends Component {
	getSpacer(pos) {
		var spacerText = ""
		var positionTexts = descriptors.positions;
		switch (pos) {
			case 1:
				spacerText = positionTexts[1];
				break;
		    case 3:
				spacerText = positionTexts[2];
				break;
			case 6:
				spacerText = positionTexts[3];
				break;
			case 11:
				spacerText = positionTexts[4];
				break;
			case 17:
				spacerText = positionTexts[5];
				break;
			case 22:
				spacerText = positionTexts[6];
				break;
			case 25:
				spacerText = positionTexts[7];
				break;
			case 27:
				spacerText = positionTexts[8];
				break;
			default:
				break;
		}

		if (spacerText === "")
			return "";

		return (
			<Spacer height="1">
				<Text subtle>{ spacerText }</Text>
			</Spacer>
		);
	}

	render() {
		return (
			<div>
				<Draggable key={this.props.id} draggableId={this.props.id} index={this.props.pos}>
					{(provided, snapshot) => (
					<div
					  ref={provided.innerRef}
					  {...provided.draggableProps}
					  {...provided.dragHandleProps}
					  className="Card"
					>
						<div className="CardPos">
							{ this.props.pos + 1 }
						</div>
						{ this.props.children }
						<div className="CardRight">
						</div>
					</div>
					)}
				</Draggable>
				{
					this.getSpacer(this.props.pos)
				}
			</div>
		);
	}
} 

export { Card };