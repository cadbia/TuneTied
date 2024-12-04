import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('http://localhost:3000/playlists');
        setPlaylists(response.data);
      } catch (err) {
        setError('Failed to fetch playlists. Please log in again.');
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (id, algorithm) => {
    navigate(`/traverse/${algorithm}?playlistId=${id}`); // Navigate to the traversal page with playlist ID
  };

  return (
    <div>
      <h1>Your Playlists</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            <span>{playlist.name} ({playlist.tracks} tracks)</span>
            <button onClick={() => handlePlaylistClick(playlist.id, 'dfs')}>DFS</button>
            <button onClick={() => handlePlaylistClick(playlist.id, 'bfs')}>BFS</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playlists;
