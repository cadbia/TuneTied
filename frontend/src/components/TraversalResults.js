import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useParams } from 'react-router-dom';

const TraversalResults = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation();
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
        const response = await axios.get(`http://localhost:3000/traverse/${algorithm}`, {
          params: { playlistId },
        });
        setResults(response.data); // take response as an array of songs
      } catch (err) {
        setError('Failed to fetch traversal results.');
        console.error(err);
      }
    };

    fetchTraversalResults();
  }, [playlistId, algorithm]);

  return (
    <div>
      <h1>{algorithm.toUpperCase()} Traversal Results</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {results.map((song, index) => (
          <li key={index}>{song}</li>
        ))}
      </ul>
    </div>
  );
};

export default TraversalResults;
