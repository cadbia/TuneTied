import React from 'react';
import LoginButton from './components/LogInButton'; // made the log in button a seperate component
import './App.css';

const App = () => {
  return (
    <div className="App">
    <h1 className="welcome-screen-text">Welcome to TuneTied !</h1>
    <LoginButton /> {}
    </div>
  );
};

export default App;
