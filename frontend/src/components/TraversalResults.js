import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

const TraversalResults = () => {
  const [results, setResults] = useState([]); // Songs
  const [availableGenres, setAvailableGenres] = useState([]); // Genres
  const [selectedGenre, setSelectedGenre] = useState('rock'); // Default genre
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { algorithm } = useParams(); // Algorithm (BFS or DFS)

  const queryParams = new URLSearchParams(location.search);
  const playlistId = queryParams.get('playlistId'); // Get playlist ID from query parameters

  useEffect(() => {
    if (!playlistId) {
      setError('Playlist ID is missing.');
      return;
    }

    const fetchTraversalResults = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/traverse/${algorithm}`, {
          params: { playlistId, startGenre: selectedGenre }, // Send selected genre
        });

        setResults(response.data.traversalResults); // Songs
        setAvailableGenres(response.data.availableGenres); // Genres
      } catch (err) {
        setError('Failed to fetch traversal results.');
        console.error(err);
      }
    };

    fetchTraversalResults();
  }, [playlistId, algorithm, selectedGenre]); // Refetch if selectedGenre changes

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value); // Update selected genre
  };

  // Filter out the genres from results (remove the first line if it's a genre)
  const filteredResults = results.filter(result => !availableGenres.includes(result));

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

      {/* Display Top 10 Songs */}
      <h2>Top 10 Songs</h2>
      <ul>
        {filteredResults && filteredResults.length > 0 ? (
          filteredResults.map((song, index) => <li key={index}>{song}</li>)
        ) : (
          <li>No songs available</li>
        )}
      </ul>
    </div>
  );
};

export default TraversalResults;
