import React, { Component } from 'react';
import { Header } from './Header/Header.js';
import Home from './Home';
import PersonalityTest from './PersonalityTest';
import PersonalityTestB from './PersonalityTestB';
import Dashboard from './Dashboard';
import Lobby from './Lobby';
import Game from './Game';
import About from './About';
import './App.css';
import { Switch, Route, withRouter } from 'react-router-dom';

class App extends Component {
	render() {
		return (
			<div className="App">
				<Header />
				<Switch>
	        <Route exact path='/' component={ Home } />
	        <Route path='/test' component={ PersonalityTest } />
	        <Route path='/testB' component={ PersonalityTestB } />
	        <Route path='/dashboard' component={ Dashboard } />
	        <Route path='/lobby' component={ Lobby } />
	        <Route path='/game' component={ Game } />
	        <Route path='/about' component={ About } />
	      </Switch>
	    </div>
		)
	}
}

export default withRouter(App);
