import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Text, Highlight, Spacer } from "./objects";
import 'array.prototype.move';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

var descriptors = require("./descriptors.json");

const reorder = (list, startIndex, endIndex) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return result;
};

class CardContainer extends Component {
	constructor(props) {
		super(props);
	}

	populateCards() {
		var cards = [];
		this.props.positions.forEach( function(id, ind){
			var statement = descriptors.statements.find(function(el){
				return el.id === id;
			});

			cards.push(<Card id={statement.id} pos={ind}>{ statement.text }</Card>)
		});
		return cards;
	}

	render() {
		return (
			<DragDropContext onDragEnd={ this.props.handleDragEnd }>
				<div className="CardContainer">
					<Text subtle>Most describes me</Text>
					<Droppable droppableId="droppable">
						{(provided, snapshot) => (
							<div
							  ref={provided.innerRef}
							>
							  { this.populateCards()
							   }
							  { provided.placeholder }
							</div>
						  )}
					</Droppable>
				</div>
			</DragDropContext>
		);
	}
} 

class Card extends Component {
	getSpacer(pos) {
		var spacerText = ""
		if (pos == 1) {
			spacerText = "Really describes me";
		} else if (pos == 3) {
			spacerText = "Describes me very well";
		} else if (pos == 6) {
			spacerText = "Describes me well";
		} else if (pos == 11) {
			spacerText = "Possibly describes me";
		} else if (pos == 17) {
			spacerText = "Doesn't really describe me";
		} else if (pos == 22) {
			spacerText = "Only describes me sometimes";
		} else if (pos == 25) {
			spacerText = "Barely describes me";
		} else if (pos == 27) {
			spacerText = "Least describes me";
		}

		if (spacerText == "")
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


export { Card, CardContainer };