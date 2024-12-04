import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

const TraversalResults = () => {
  const [results, setResults] = useState([]); // Songs
  const [availableGenres, setAvailableGenres] = useState([]); // Genres (limited to top 10)
  const [selectedGenre, setSelectedGenre] = useState(''); // Default genre
  const [numSongs, setNumSongs] = useState(10); // Default number of songs to display
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for delay
  const [manualSelection, setManualSelection] = useState(false); // Track if user manually selects a genre

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
          params: { playlistId, startGenre: selectedGenre, limit: numSongs },
        });

        setResults(response.data.traversalResults); // Songs
        setAvailableGenres(response.data.availableGenres); // Top 10 Genres
        if (response.data.topGenre && !manualSelection) {
          setSelectedGenre(response.data.topGenre);
          setTimeout(() => setLoading(false),  2000);
        } else if(!response.data.availableGenres && !manualSelection) {
          setError('Top genre not found.');
        }


      } catch (err) {
        setError('Failed to fetch traversal results.');
        console.error(err);
        setLoading(false); 
      }
    };

    fetchTraversalResults();
  }, [playlistId, algorithm, selectedGenre, numSongs]);

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
    setManualSelection(true); 
  };

  const incrementSongs = () => {
    setNumSongs((prev) => Math.min(prev + 1, 50));

    setLoading(false);  
  };

  const decrementSongs = () => {
    setNumSongs((prev) => Math.max(prev - 1, 1));
  
    setLoading(false); 
  };

  return (
    <div>
      <h1>{algorithm.toUpperCase()} Mini Playlist</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
     
      {/* Genre Selection Dropdown */}
      <label htmlFor="genre-select">Select a Genre:</label>
      <select id="genre-select" value={selectedGenre} onChange={handleGenreChange}>
        {availableGenres.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>

      {/* Title with Increment/Decrement Buttons */}
      <h2>
        Top{' '}
        <button onClick={decrementSongs} style={{ marginRight: '5px' }}>
          -
        </button>
        {numSongs}
        <button onClick={incrementSongs} style={{ marginLeft: '5px' }}>
          +
        </button>{' '}
        Songs
      </h2>
       {/* Genre Title */}
       <h2 style={{ textDecoration: 'underline' }}>{selectedGenre.toUpperCase()}</h2>


      {/* Display the Top Songs */}
      {loading ? (
        <p>Loading top songs...</p> // Loading message
      ) : (
        <ul>
          {results.length > 0 ? (
            results.slice(1).map((song, index) => <li key={index + 1}>{song}</li>)
          ) : (
            <li>No songs available</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default TraversalResults;