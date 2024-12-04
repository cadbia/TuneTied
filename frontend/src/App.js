// FRONTEND FOR TUNETIED WEBSITE
// To run call 'npm start' from command line inside the frontend folder
// To stop server ^C

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginButton from './components/LogInButton';
import Playlists from './components/Playlists'; // Import Playlists component
import TraversalResults from './components/TraversalResults';
import './App.css';

// routes used: a weclome screen with log in button, a playlist screen displaying a list of playlists, and a traversal route showing organized playlists
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/traverse/:algorithm" element={<TraversalResults />} /> {/* Show traversal results */}
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

