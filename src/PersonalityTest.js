import React, { Component } from 'react';
import { Header, Button, Heading, Text, Highlight, Spacer } from './objects';
import { Card, CardContainer } from './testObjects';
import './App.css';
import { Link } from 'react-router-dom';

var descriptors = require("./descriptors.json");

class PersonalityTest extends Component {
	constructor(props) {
		super(props);

		this.state = {
			positions: Array(),
		}

		this.handleDragEnd = this.handleDragEnd.bind(this);
		this.saveChoices = this.saveChoices.bind(this);
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

			tempPos = this.shuffle(tempPos);
			this.setState({
				positions: tempPos,
			});
		}		
	}

	shuffle(array) {
		var m = array.length, t, i;

		// While there remain elements to shuffle…
		while (m) {

			// Pick a remaining element…
			i = Math.floor(Math.random() * m--);

			// And swap it with the current element.
			t = array[m];
			array[m] = array[i];
			array[i] = t;
		}

		return array;
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

	saveChoices(){
		// Max point score:
		// 48
		// Min point score:
		// 12

		// Put the descriptors into an array based on position
		var orderedDescriptors = Array();
		this.state.positions.forEach(function(id, pos){
			orderedDescriptors.push(
				descriptors.statements.find(x => x.id == id)
			);
		});

		var divisions = [2, 2, 3, 5, 6, 5, 3, 2, 2];
		if (divisions.reduce((a, b) => a + b, 0) != 30) {
			alert("Divisions wrong!");
			return;
		}

		var scores = {
			o: 0,
			c: 0,
			e: 0,
			a: 0,
			n: 0
		}

		orderedDescriptors.forEach(function(item, ind){
			var total = 0;
			var score;
			for (var i=0; i<divisions.length; i++){
				if (ind < total+divisions[i]){
					score = 9-i;
					console.log(score);
					break;
				}
				total += divisions[i];
			}

			scores[item.factor] += score;
		});

		// Convert each score to a percentage
		for (var key in scores){
			var item = scores[key];
			scores[key] = (item - 12)/(48-12);
		}

		console.log(scores);

		return;
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>It's simple</Heading>
				<Text big>Arrange the cards in order, from <br /><Highlight>"most describes me"</Highlight> to <Highlight>"least describes me"</Highlight></Text>
			
				<CardContainer positions={ this.state.positions } handleDragEnd={ this.handleDragEnd }>
				</CardContainer>
				<Button onClick={ this.saveChoices }>
					I'm finished
				</Button>
				<Spacer height="1" />
			</div>
		);
	}
}

export default PersonalityTest;
