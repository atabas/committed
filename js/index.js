// for frontend
require('babel-polyfill');
//var actions = require('./actions/index');
import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Router, Route, hashHistory, IndexRoute} from 'react-router';
//var store = require('./store');

class App extends React.Component{
  render(){
    return(
      <div>
        <h1>My app</h1>
        {this.props.children}
      </div>
    );
  }
}

class Btn extends React.Component{
  constructor(props){
    super(props);
    this.clickCurrentUser = this.clickCurrentUser.bind(this);
    this.clickCurrentUser();
  }

  clickButton(){
    window.location.href="/auth/github";
  }
  clickLogout(){
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    window.location.href="/logout";
  }
  clickCurrentUser(){
    if (!('token' in this.props.params)){
      return;
    }
    let token = this.props.params.token;
    let username =this.props.params.username;

    console.log("username: ", username, "token: ", token);
    localStorage['username']=username;
    localStorage['token'] = token;
    
    axios.get('/current_user', {
      auth: {
        username: localStorage['username'],
        password: localStorage['token']
      }
    })
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
  
  }
  render(){
    let btns = "";
    if('username' in localStorage){
      btns = (<div className="auth-btn">
          <button onClick={this.clickLogout}> Logout </button><br/>
          <button onClick={this.clickCurrentUser}> Get current user info </button><br/>
        </div>)
    }
    else{
      btns = (<div className="auth-btn">
          <button onClick={this.clickButton}> Auth with github</button><br/>
          <button onClick={this.clickCurrentUser}> Get current user info </button><br/>
        </div>)
    }
    return(
      <div>
        {btns}
      </div>
      
    );
  }
}

var routes = (<Router history={hashHistory}>
  <Route path="/" component={App} >
    <IndexRoute component={Btn} />
    <Route path='userLogin/:token/:username' component={Btn}></Route>
  </Route>
</Router>);

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(routes, document.getElementById('app'));
});

export default routes;