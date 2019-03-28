import React, { Component } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import { QUERY_VARS } from '../config.js'
import './LoggedIn.css';

class LoggedIn extends Component {
	constructor(props){
		super(props);

		this.state = {
			loggedInUpdated: false,
			loggedIn: false,
		}

		this.doLogin = this.doLogin.bind(this);
		this.doLogout = this.doLogout.bind(this);
		this.copyToClipboard = this.copyToClipboard.bind(this);
		this.textInput = React.createRef();

		//localStorage.removeItem("userHash");
	}

	componentDidMount(){
		this.getUserHash();
	}

	getUserHash(){
		var userHash = localStorage.getItem('userHash');

		if (userHash) {
			this.textInput.current.defaultValue = userHash;
		} else {
			this.textInput.current.defaultValue = "";
		}

		this.setState({
			loggedIn: !!userHash,
			loggedInUpdated: true,
		});
	}

	doLogin(evt){
		var hash = this.textInput.current.value;
		var query = `query Profile($hash: String!){
			profile(hash: $hash) {
				hash
			}
		}`; 

		fetch(QUERY_VARS.url, {
			method: QUERY_VARS.method,
			headers: QUERY_VARS.headers,
			body: JSON.stringify({
		    	query,
		    	variables: { hash },
		  	})
		})
		.then(r => r.json())
		.then(data => {
			if (data.errors) {
				alert("An error occured");
			  	return;
			  	// TODO throw proper error
			}

			if (data.data.profile.hash) {
				localStorage.setItem("userHash", data.data.profile.hash);
			}

			this.getUserHash();
		});
		return;
	}

	doLogout(evt){
		localStorage.removeItem("userHash");
		this.textInput.current.value = "";
		this.getUserHash();
	}

	copyToClipboard(evt){
		this.textInput.current.select();
	    document.execCommand('copy');
	    evt.target.focus();
	}

	render() {
		var loggedIn = this.state.loggedIn;
		return (
			<div>
				{ ["/test", "/testB", "/"].includes(this.props.location.pathname) && loggedIn && this.state.loggedInUpdated ? 
						<Redirect to="/dashboard" /> : "" }
				{ ["/dashboard", "/lobby", "/game"].includes(this.props.location.pathname) && !loggedIn && this.state.loggedInUpdated ? 
						<Redirect to="/" /> : "" }
				<div style={ {display: "flex", alignItems: "center"} } >
					<input className="LoggedIn"
						placeholder={ loggedIn ? "" : "Not logged in" }
					 	ref={this.textInput} 
					 />
					<div onClick={ loggedIn ? this.copyToClipboard : this.doLogin } className="LoggedInCopyBtn">
						<img src={ loggedIn ? require("../resources/copyIcon.svg") :
									require("../resources/goIcon.svg") }
							className="LoggedInCopyBtnImg" />
					</div>
					{ 
						loggedIn ? 
						<div className="LogoutBtn" onClick={ this.doLogout }>
							<img src={ require("../resources/cross.svg") }
								className="LogoutBtnImg" />
						</div> : ""
					}
				</div>
			</div>
		);
	}
}

LoggedIn = withRouter(LoggedIn);

export { LoggedIn };