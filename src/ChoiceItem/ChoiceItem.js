import React, { Component } from 'react';
import './ChoiceItem.css';

class ChoiceItem extends Component {
	constructor(props) {
		super(props);

		this.images = {
			holdDefault: require("../resources/holdDefault.svg"),
			holdSelected: require("../resources/holdSelected.svg"),
			holdHover: require("../resources/holdHover.svg"),
			splitDefault: require("../resources/splitDefault.svg"),
			splitSelected: require("../resources/splitSelected.svg"),
			splitHover: require("../resources/splitHover.svg"),
			grabDefault: require("../resources/grabDefault.svg"),
			grabSelected: require("../resources/grabSelected.svg"),
			grabHover: require("../resources/grabHover.svg"),
		}

		if (this.props.hold)
			this.text = "Hold";
		else if (this.props.split)
			this.text = "Split";
		else if (this.props.grab)
			this.text = "Grab";

		this.state = {
			imageObj: this.images.holdDefault,
			hover: false
		}

		this.setHover = this.setHover.bind(this);
		this.setNormalImage = this.setNormalImage.bind(this);
		this.handleClick = this.handleClick.bind(this);
	}

	componentDidMount() {
		this.setNormalImage();
	}

	componentDidUpdate(prevProps) {
		if (prevProps.selected !== this.props.selected) {
			if (this.props.selected)
				this.setHover()
			else
				this.setNormalImage();
		}
	}

	setUnhover() {
		this.setNormalImage();
	}

	setNormalImage() {
		var imageObj = this.images.holdDefault;

		if (!this.props.selected) {
			if (this.props.split)
				imageObj = this.images.splitDefault;
			else if (this.props.grab)
				imageObj = this.images.grabDefault;
		} else {
			if (this.props.hold)
				imageObj = this.images.holdSelected;
			else if (this.props.split)
				imageObj = this.images.splitSelected;
			else if (this.props.grab)
				imageObj = this.images.grabSelected;
		}

		this.setState({ imageObj: imageObj });
	}

	setHover() {
		if (this.props.hold)
			this.setState({imageObj: this.images.holdHover});
		else if (this.props.split)
			this.setState({imageObj: this.images.splitHover});
		else if (this.props.grab)
			this.setState({imageObj: this.images.grabHover});
	}

	handleClick() {
		if (this.props.hold)
			this.props.clickCallback(0);
		else if (this.props.split)
			this.props.clickCallback(1);
		else if (this.props.grab)
			this.props.clickCallback(2);
	}

	render() {
		return (
			<div className="ChoiceItem" onMouseEnter={ this.setHover } onMouseLeave={ this.setNormalImage } onClick={ this.handleClick }>
				<img src={ this.state.imageObj } alt={ this.text + " icon" } /><br />
				{ this.text }
			</div>
		);
	}
}

export { ChoiceItem };