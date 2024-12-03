// FRONTEND
// To run frontend call 'npm start' from command line
// To stop server ^C


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlaylistDropdown from './PlaylistDropdown';
import TrackList from './TrackList';

function App() {
  const [playlists, setPlaylists] = useState([]); // State for playlists
  const [selectedPlaylist, setSelectedPlaylist] = useState(''); // State for selected playlist
  const [tracks, setTracks] = useState([]); // State for tracks
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status

  // Function to handle Spotify login
  const handleSpotifyLogin = () => {
    // Redirect to backend login endpoint
    window.location.href = 'http://localhost:3000/login';
  };

  // Fetch playlists on component mount
  useEffect(() => {
    // Check if user is logged in by attempting to fetch playlists
    axios.get('http://localhost:3000/playlists')
      .then((response) => {
        setPlaylists(response.data); // Set playlists from API
        setIsLoggedIn(true);
      })
      .catch((error) => {
        // If unauthorized, user is not logged in
        if (error.response && error.response.status === 401) {
          setIsLoggedIn(false);
        } else {
          console.error('Error fetching playlists:', error);
        }
      });
  }, []);

  // Fetch tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist) {
      axios.get(`http://localhost:3000/playlist/${selectedPlaylist}`)
        .then((response) => {
          setTracks(response.data); // Set tracks from API
        })
        .catch((error) => {
          console.error('Error fetching tracks:', error);
        });
    }
  }, [selectedPlaylist]);

  return (
    <div>
      <h1>Spotify Playlist Viewer</h1>
      
      {!isLoggedIn ? (
        <div>
          <p>Please login to access your Spotify playlists</p>
          <button onClick={handleSpotifyLogin}>
            Login with Spotify
          </button>
        </div>
      ) : (
        <>
          <PlaylistDropdown
            playlists={playlists}
            onSelect={(playlistId) => setSelectedPlaylist(playlistId)}
          />
          <TrackList tracks={tracks} />
        </>
      )}
    </div>
  );
}

export default App;