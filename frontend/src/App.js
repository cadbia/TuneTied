// FRONTEND FOR TUNETIED WEBSITE
// To run call 'npm start' from command line inside the frontend folder
// To stop server ^C

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginButton from './components/LogInButton';
import Playlists from './components/Playlists'; // Import Playlists component
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/playlists" element={<Playlists />} />
      </Routes>
    </Router>
  );
};

const WelcomeScreen = () => (
  <div className="App">
    <h1 className="welcome-screen-text">Welcome to TuneTied!</h1>
    <LoginButton />
  </div>
);

export default App;
