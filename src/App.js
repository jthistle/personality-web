import React, { Component } from 'react';
import { Header, Button } from './objects';
import Dice from './Dice';
import Home from './Home';
import PersonalityTest from './PersonalityTest';
import PersonalityTestB from './PersonalityTestB';
import './App.css';
import { Switch, Route, withRouter, Redirect } from 'react-router-dom';

class App extends Component {
	render() {
		return (
			<div className="App">
				<Header />
				<Switch>
	        <Route exact path='/' component={ Home } />
	        <Route path='/dice' component={ Dice } />
	        <Route path='/test' component={ PersonalityTest } />
	        <Route path='/testB' component={ PersonalityTestB } />
	      </Switch>
	    </div>
		)
	}
}

export default withRouter(App);
