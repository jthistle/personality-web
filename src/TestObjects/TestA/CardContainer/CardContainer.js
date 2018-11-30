import React, { Component } from 'react';
import { Text } from '../../../Text/Text.js';
import { Card } from '../Card/Card.js';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import './CardContainer.css';

var descriptors = require("../../../descriptors.json");

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

export { CardContainer };