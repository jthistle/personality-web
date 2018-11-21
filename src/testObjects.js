import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Text, Highlight } from "./objects";
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

		this.state = {
			positions: Array(),
		}

		this.handleDragEnd = this.handleDragEnd.bind(this);
	}

	componentDidMount() {
		var savedPos = JSON.parse(localStorage.getItem('testPositions'));

		if (savedPos) {
			this.setState({
				positions: savedPos,
			});
		} else {
			var tempPos = Array();
			descriptors.statements.forEach (function(item, ind) {
				tempPos.push(item.id);
			});
			this.setState({
				positions: tempPos,
			});
		}		
	}

	handleDragEnd(result) {
	    // dropped outside the list
	    if(!result.destination) {
	       return; 
	    }
	    
	    this.move(result.source.index, result.destination.index);
	    localStorage.setItem('testPositions', JSON.stringify(this.state.positions));
	}

	move(fromInd, toInd){
		var pos = this.state.positions;

		if (toInd >= 0 && toInd < pos.length && fromInd >= 0 && fromInd < pos.length) {
			pos.move(fromInd, toInd);
		}

		this.setState({positions: pos});
	}

	moveTo(id, ind){
		var pos = this.state.positions;

		if (ind >= 0 && ind < pos.length) {
			pos.move(pos.indexOf(id), ind);
		}

		this.setState({positions: pos});
	}

	populateCards() {
		var cards = [];
		this.state.positions.forEach( function(id, ind){
			var statement = descriptors.statements.find(function(el){
				return el.id === id;
			});

			cards.push(<Card id={statement.id} pos={ind}>{ statement.text }</Card>)
		});
		return cards;
	}

	render() {
		return (
			<DragDropContext onDragEnd={this.handleDragEnd}>
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
					<Text subtle>Least describes me</Text>
				</div>
			</DragDropContext>
		);
	}
} 

class Card extends Component {
	render() {
		return (

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
		);
	}
} 


export { Card, CardContainer };