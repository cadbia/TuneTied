import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

const TraversalResults = () => {
  const [results, setResults] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('rock'); // Default to 'rock'
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { algorithm } = useParams(); // Get DFS or BFS from the route

  const queryParams = new URLSearchParams(location.search);
  const playlistId = queryParams.get('playlistId'); // Get playlist ID from query parameters

  useEffect(() => {
    if (!playlistId) {
      setError('Playlist ID is missing.');
      return;
    }

    const fetchTraversalResults = async () => {
      try {
        // Fetch traversal results and available genres
        const response = await axios.get(`http://localhost:3000/traverse/${algorithm}`, {
          params: { playlistId, startGenre: selectedGenre }, // Send selected genre
        });

        setResults(response.data.traversalResults); // Take response as an array of songs
        setAvailableGenres(response.data.availableGenres); // Set available genres
      } catch (err) {
        setError('Failed to fetch traversal results.');
        console.error(err);
      }
    };

    fetchTraversalResults();
  }, [playlistId, algorithm, selectedGenre]); // Fetch results when selectedGenre changes

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value); // Update the selected genre
  };

  return (
    <div>
      <h1>{algorithm.toUpperCase()} Mini Playlist</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Genre Selection Dropdown */}
      <label htmlFor="genre-select">Select a Genre:</label>
      <select id="genre-select" value={selectedGenre} onChange={handleGenreChange}>
        {availableGenres && availableGenres.length > 0 ? (
          availableGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))
        ) : (
          <option value="">No genres available</option>
        )}
      </select>

      <ul>
        {results && results.length > 0 ? (
          results.map((song, index) => (
            <li key={index}>{song}</li>
          ))
        ) : (
          <li>No results available</li>
        )}
      </ul>
    </div>
  );
};

export default TraversalResults;