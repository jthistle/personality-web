import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Text, Highlight, Spacer } from "./objects";
import 'array.prototype.move';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

class Slider extends Component {
	constructor(props){
		super(props);
		this.state = {
			inputValue: '50',
			skipNextUpdate: false,
		}

		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);
	}

	handleKeyPress(evt){
		if (evt.key === "Enter")
			this.handleMouseUp();
	}

	handleMouseUp(evt) {
		this.props.handleMouseUp();
		this.setState({
			inputValue: '50',
			skipNextUpdate: true
		});
	}

	updateInputValue(evt) {
		this.props.updateSliderValue(evt.target.value);

		if (! this.state.skipNextUpdate) {
		    this.setState({
		      inputValue: evt.target.value
		    });
		} else {
			this.setState({
		      skipNextUpdate: false,
		    });
		}
	}

	render(){
		return (
			<div className="SliderBWrapper">
				<input onMouseUp={ this.handleMouseUp } className="SliderB" 
					id="slider" type="range" min={ this.props.min } max={ this.props.max } 
					value={this.state.inputValue} onChange={evt => this.updateInputValue(evt)}
					onKeyPress={this.handleKeyPress} />
			</div>
    	);
   	}
}

class Card extends Component {
	render() {
		return (
			<div className="CardB">
				{ this.props.children }
			</div>
		);
	}
}

export { Card, Slider };