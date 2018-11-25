import React, { Component } from 'react';
import { Link, Redirect, withRouter } from 'react-router-dom';

class Heading extends Component {
	render() {
		return (
			<div className="Heading">
				{ this.props.children }
			</div>
		);
	}
}

class Text extends Component {
	render() {
		return (
			<div className={ (this.props.big ? " BigText" : "") + (this.props.subtle ? " SubtleText" : "") }>
				{ this.props.children }
			</div>
		);
	}
}

class Highlight extends Component {
	render() {
		return (
			<div className="Highlight">
				{ this.props.children }
			</div>
		);
	}
} 

class Button extends Component {
	constructor(props) {
		super(props);
	}

	content() {
		return (
			<div className={ "Button"+ (this.props.big ? " BigButton" : "") } onClick={this.props.onClick}>
				{ this.props.text }
				{ this.props.children }
			</div>
		);
	}

	render() {
		return (
			<div>
			{ 
				this.props.linkTo ? 
				<Link to={ this.props.linkTo }>{ this.content() }</Link> 
				: <div> { this.content() } </div>
			}
			</div>
		);
	}
}

function Title() {
	return (
		<div className="Title">
			<Highlight>Personality</Highlight>
		</div>
	);
}

class HeaderItem extends Component {
	constructor(props) {
		super(props);
	}

	alignClass() {
		return "HeaderItem HeaderItem"+this.props.align;
	}

	render() {
		return (
			<div className={ this.alignClass() }>
				{ this.props.text }
				{ this.props.children }
			</div>
		);
	}
}

class LoggedIn extends Component {
	constructor(props){
		super(props);

		this.state = {
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
			this.setState({ loggedIn: true, });
		} else {
			this.textInput.current.defaultValue = "";
			this.setState({ loggedIn: false, });
		}
	}

	doLogin(evt){
		// fb5998adae0304fb0997c4c96191c5f35eb95543
		var hash = this.textInput.current.value;
		var query = `query Profile($hash: String!){
			profile(hash: $hash) {
				hash
			}
		}`; 

		fetch('http://localhost:4000/graphql', {
			  method: 'POST',
			  headers: {
			    'Content-Type': 'application/json',
			    'Accept': 'application/json',
			    'Access-Control-Allow-Origin': '*',
			  },
			  body: JSON.stringify({
			    query,
			    variables: { hash },
			  })
			}).then(r => r.json())
			  .then(console.log("done"))
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
				{ ["/test", "/testB"].includes(this.props.location.pathname) && loggedIn ? 
						<Redirect to="/" /> : "" }
				<div style={ {display: "flex", alignItems: "center"} } >
					<input className="LoggedIn"
						placeholder={ loggedIn ? "" : "Not logged in" }
					 	ref={this.textInput} 
					 />
					<div onClick={ loggedIn ? this.copyToClipboard : this.doLogin } className="LoggedInCopyBtn">
						<img src={ loggedIn ? require("./resources/copyIcon.svg") :
									require("./resources/goIcon.svg") }
							className="LoggedInCopyBtnImg" />
					</div>
					{ 
						loggedIn ? 
						<div className="LogoutBtn" onClick={ this.doLogout }>
							<img src={ require("./resources/cross.svg") }
								className="LogoutBtnImg" />
						</div> : ""
					}
				</div>
			</div>
		);
	}
}

LoggedIn = withRouter(LoggedIn);

class Header extends Component {
	constructor(props) {
		super(props);
	}

	getLoggedIn() {
		var userHash = localStorage.getItem('userHash');
		if (userHash) {
			return userHash;
		} else{
			return "Not logged in";
		}
	}

	render() {
		return (
			<div className="Header">
				<Title />
				<HeaderItem>
					<Button className="HeaderItem" linkTo="/" text="To Home" />
				</HeaderItem>
				<HeaderItem>
					<Button className="HeaderItem" linkTo="dashboard" text="To Dashboard" />
				</HeaderItem>
				<HeaderItem align="Right">
					<LoggedIn />
				</HeaderItem>
			</div>
		);
	}
}

class Spacer extends Component {
	render() {
		return (
			<div style={ {width: "100%", display: "block", height: this.props.height.toString()+"rem"} }>
				{ this.props.children }
			</div>
		);
	}
}


export { Header, Button, Heading, Text, Highlight, Spacer };
export default Header;