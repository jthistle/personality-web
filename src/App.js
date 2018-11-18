import React, { Component } from 'react';
import { Header, Button } from './objects';
import Dice from './Dice';
import Home from './Home';
import './App.css';
import { Switch, Route } from 'react-router-dom';

class App extends Component {
	render() {
		return (
			<Switch>
        <Route exact path='/' component={ Home } />
        <Route path='/dice' component={ Dice } />
      </Switch>
      //<Dice />
		)
	}
}

export default App;
