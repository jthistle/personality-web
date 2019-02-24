import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Spacer } from './Spacer/Spacer.js'; 
import { Button } from './Button/Button.js';
import { Highlight } from './Highlight/Highlight.js';
import { Panel, PanelItem } from './Panel/Panel.js';
import './App.css';
import { Link } from 'react-router-dom';
import { QUERY_VARS } from './config.js';

var translations = require("./personalityTranslations.json");

class Dashboard extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			profile: {}
		}
	}

	componentDidMount() {
		this.getProfile();
	}

	getProfile() {
		var hash = localStorage.getItem("userHash");
		var vars = {hash};

		var query = `query ProfileQuery($hash: String!) {
			profile(hash: $hash) {
				profileData {
					o
					c
					e
					a
					n
				}
			}
		}`; 

		fetch(QUERY_VARS.url, {
			method: QUERY_VARS.method,
			headers: QUERY_VARS.headers,
			body: JSON.stringify({
		    	query,
		    	variables: vars,
		  	})
		})
		.then(r => r.json())
		.then(console.log("done"))
		.then(data => { 
			//console.log(data.data.profile.profileData);
			this.setState({profile: data.data.profile.profileData});
		});
	}

	personalityPanel() {
		var panelItems = [];
		for (var ind in this.state.profile) {
			var facet = translations.facets[ind];
			var fname = facet.name;
			var fval = this.state.profile[ind];
			var fdescriptor = "???";

			// This relies on facet.descriptors being ordered by min value descending
			for (var d of facet.descriptors) {
				if (fval >= d.min) {
					fdescriptor = d.text;
					break;
				}
			}
			panelItems.push(
				<PanelItem key={ ind }>
					{ fdescriptor }
				</PanelItem>
			);
		}

		return (
			<Panel>
				<PanelItem header>Your Personality</PanelItem>
				{ panelItems }
			</Panel>
		);
	}

	toggleWaiting() {
		return;
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>Who you are</Heading>
				<Text subtle>This is the best estimation of your personality based on your responses.</Text>
				<Text>Click below to play a simple but devious game of trust, and help research into personality.</Text>
				<Spacer height="2" />
				<Button big linkTo="lobby">Play now</Button>
				{ this.personalityPanel() }
				<Spacer height="1" />
			</div>
		);
	}
}

export default Dashboard;
