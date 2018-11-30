import React, { Component } from 'react';
import './Slider.css';

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
		if (! this.state.skipNextUpdate) {
			this.props.updateSliderValue(evt.target.value);
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
				<div style={{cursor: "pointer"}}>
					<input className="SliderB" onTouchEnd={ this.handleMouseUp } onMouseUp={ this.handleMouseUp }
						id="slider" type="range" min="0" max="100"
						value={this.state.inputValue} onChange={evt => this.updateInputValue(evt)}
						onKeyPress={this.handleKeyPress} />
				</div>
			</div>
    	);
   	}
}

export { Slider };