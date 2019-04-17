import React, { Component } from 'react';
import { Text } from './Text/Text.js';
import { Heading } from './Heading/Heading.js';
import { Spacer } from './Spacer/Spacer.js'; 
import { Highlight } from './Highlight/Highlight.js';
import './App.css';

class About extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div id="MainWrapper">
				<Heading>About <Highlight>Personality</Highlight></Heading>
                <Text>Personality is an experiment to answer this question:</Text>
                <Spacer height="2" />
                <Text big>To what extent can social interactions between people in a small group be accurately mathematically modelled?</Text>
                <Spacer height="2" />
                <Text>
                    This is as part of a school project. I hope to be able to use the data collected to create a
                    mathematical model to predict how people will get on with each other based on how they respond to
                    questions about this personality. But this can only work if people answer questions honestly
                    and talk to each other in a real and honest way.
                </Text>
                <Spacer height="2" />
                <Text big><Highlight>Privacy</Highlight></Text>
                <Spacer height="1" />
                <Text>
                    The only data collected about you is the data you provide. This is: your reponses to the survey,
                    your choices in games, what you say in the chat in games, and who you choose as your most liked
                    and least liked person at the end of each game. <b>No</b> personally identifiable information, like IP
                    address, location, browser etc. is collected.
                </Text>
                <Spacer height="2" />
                <Text big><Highlight>Code</Highlight></Text>
                <Spacer height="1" />
                <Text>
                    Personality is open-source. The code repository is <a href="https://github.com/jthistle/personality-web" target="_blank">located on GitHub</a>.<br />
                    Due to the nature of this project, unfortunately I can't accept contributions, but the entire
                    codebase is GPL v2 licensed, so cloning it, modifying it, and all the other usual open source
                    stuff is permitted.
                </Text>
			</div>
		);
	}
}

export default About;
