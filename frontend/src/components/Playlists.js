import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get('http://localhost:3000/playlists'); // Ensure CORS is configured
        setPlaylists(response.data);
      } catch (err) {
        setError('Failed to fetch playlists. Please log in again.');
      }
    };

    fetchPlaylists();
  }, []);

  return (
    <div>
      <h1>Your Playlists</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {playlists.map((playlist) => (
          <li key={playlist.id}>
            {playlist.name} ({playlist.tracks} tracks)
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Playlists;