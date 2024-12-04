// BACKEND FOR SPOTIFY API REQUESTS
// To run server call 'node index.js' from command line
// To stop server ^C

const express = require('express');
const axios = require('axios'); // Axios for making HTTP requests
const dotenv = require('dotenv'); // Dotenv for managing environment variables
const querystring = require('querystring'); // For parsing querystrings
const readline = require('readline'); // For terminal input
const { weightedDepthFirstSearch, weightedBreadthFirstSearch } = require('./graphTraversal'); // Traversal functions

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const PORT = 3000; // Server port

const app = express();
const cors = require('cors'); // Import CORS

app.use(cors({ origin: 'http://localhost:3001' }));

let accessToken = null;
let storedState = null;
let graph = {}; // Graph structure to store song genres and relationships

// Fetch playlist data from Spotify API
async function fetchPlaylistData(playlistId) {
  try {
      console.log("Fetching playlist data for ID:", playlistId);

      // Fetch all tracks in the playlist
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: {
              Authorization: `Bearer ${accessToken}`
          },
      });

      // Extract artist IDs from the tracks to fetch artist genres
      const artistIds = [
          ...new Set(
              response.data.items.flatMap((item) => item.track.artists.map((artist) => artist.id))
          ),
      ];

      // Fetch artist details to retrieve genres
      const artistResponse = await axios.get('https://api.spotify.com/v1/artists', {
          params: { ids: artistIds.slice(0, 50).join(',') },  // Spotify allows up to 50 IDs per request
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });

      // Map artist genres by artist ID for quick lookup
      const artistGenres = artistResponse.data.artists.reduce((acc, artist) => {
          acc[artist.id] = artist.genres;  // Save genres by artist ID
          return acc;
      }, {});

      // Format the tracks with genres pulled from artists
      const tracks = response.data.items.map((item) => {
          const genres = item.track.artists
              .flatMap((artist) => artistGenres[artist.id] || [])
              .join(', ');

          return {
              name: item.track.name,
              artist: item.track.artists.map((artist) => artist.name).join(', '),
              album: item.track.album.name,
              duration_ms: item.track.duration_ms,
              genres: genres || 'unknown',  // Fallback if no genres found
              explicit: item.track.explicit,
              popularity: item.track.popularity,
              release_date: item.track.album.release_date,
              added_at: item.added_at,
          };
      });

      return tracks;  // Return the formatted track data with genres

  } catch (error) {
      console.error("Error fetching playlist data:", error.response?.data || error.message);
      return [
          { name: "Song1", genres: "rock" },
          { name: "Song2", genres: "rock, pop" },
          { name: "Song3", genres: "pop" }
      ];  // Return mock data in case of failure
  }
}


console.log("Access Token:", accessToken);
function buildGraph(data) {
  const graph = {};

  // First, create a node for each song and initialize an empty array for each genre
  data.forEach((song) => {
    const genres = song.genres.split(', ').map((genre) => genre.trim());
    genres.forEach((genre) => {
      if (!graph[genre]) {
        graph[genre] = [];  // Initialize empty array if genre is not yet in the graph
      }
      // Add song to the list of songs for that genre
      graph[genre].push({ song: song.name, weight: 0 }); // Initially weight is 0
    });
  });

  // Now calculate the weights based on shared genres between songs
  Object.keys(graph).forEach(genre => {
    const songs = graph[genre];

    songs.forEach((songA, indexA) => {
      songs.forEach((songB, indexB) => {
        if (indexA !== indexB) {
          // Find shared genres between songA and songB
          const sharedGenres = graph[genre].filter(s => s.song === songB.song).length;
          // Increase the weight for the shared songs
          const existingConnection = graph[genre].find(s => s.song === songB.song);
          if (existingConnection) {
            existingConnection.weight += sharedGenres;
          }
        }
      });
    });
  });

  console.log("Built graph with weighted edges:", graph);  // Log to verify the structure
  return graph;
}



// Terminal interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', async (input) => {
    const [command, ...args] = input.split(' ');

    switch (command) {
        case 'load':
            if (args.length < 1) {
                console.log('Usage: load <playlistId>');
                break;
            }
            const playlistId = args[0];
            try {
                const newGraph = await fetchPlaylistData(playlistId);
                graph = buildGraph(newGraph);
                console.log('Graph loaded successfully.');
            } catch (error) {
                console.error('Failed to load graph:', error);
            }
            break;

        case 'dfs':
            if (!graph || Object.keys(graph).length === 0) {
                console.log('Graph not initialized. Use "load" to load a playlist.');
                break;
            }
            const dfsStart = args[0] || 'rock';
            console.log('DFS Result:', depthFirstSearch(graph, dfsStart));
            break;

        case 'bfs':
            if (!graph || Object.keys(graph).length === 0) {
                console.log('Graph not initialized. Use "load" to load a playlist.');
                break;
            }
            const bfsStart = args[0] || 'rock';
            console.log('BFS Result:', breadthFirstSearch(graph, bfsStart));
            break;

        case 'exit':
            console.log('Exiting application...');
            rl.close();
            break;

        default:
            console.log('Unknown command. Available commands: load <playlistId>, dfs <startNode>, bfs <startNode>, exit');
            break;
    }
});

console.log('Welcome to the TuneTied CLI.');
console.log('Commands: load <playlistId>, dfs <startNode>, bfs <startNode>, exit');

// Express routes
app.get('/', (req, res) => {
    res.send('TuneTied Running!');
});

app.get('/login', (req, res) => {
  storedState = Math.random().toString(36).substring(2, 15);
  const scope = 'playlist-read-private';

  const authUrl = 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
          response_type: 'code',
          client_id: CLIENT_ID,
          scope: scope,
          redirect_uri: REDIRECT_URI,
          state: storedState
      });

  //console.log('Authorization URL:', authUrl); // Debug log
  res.redirect(authUrl);
});


app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null || state !== storedState) {
      console.error('State mismatch:', state, storedState); // Log mismatch
      res.redirect('http://localhost:3001/#error=state_mismatch');
      return;
  }

  const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
          code: code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
      },
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      json: true,
  };

  try {
      const response = await axios.post(authOptions.url, authOptions.form, { headers: authOptions.headers });
      accessToken = response.data.access_token;
      console.log('Access Token:', accessToken); // Log success
      res.redirect('http://localhost:3001/playlists');
  } catch (error) {
      console.error('Error in callback:', error.response?.data || error.message); // Log detailed error
      res.redirect('http://localhost:3001/#error=authentication_failed');
  }
});

app.get('/playlists', async (req, res) => {
  if (!accessToken) {
      console.error("Access token missing. User needs to log in.");
      return res.status(401).send('Access token unavailable. Log in at /login.');
  }

  try {
      const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
          headers: {
              Authorization: `Bearer ${accessToken}`
          },
      });

      const playlists = playlistsResponse.data.items
          .filter((playlist) => playlist && playlist.id && playlist.name && playlist.tracks)
          .map((playlist) => ({
              id: playlist.id,
              name: playlist.name,
              tracks: playlist.tracks.total,
          }));

      console.log('Fetched playlists:', playlists);
      res.json(playlists);
  } catch (error) {
      console.error('Error fetching playlists:', error.response?.data || error.message);
      res.status(500).send('Failed to fetch playlists.');
  }
});



app.get('/mini-playlist/:id', async (req, res) => {
    const playlistId = req.params.id;
    const { startGenre } = req.query;

    try {
        const playlistData = await fetchPlaylistData(playlistId);
        graph = buildGraph(playlistData);
        const miniPlaylist = breadthFirstSearch(graph, startGenre || '').slice(0, 10);
        res.json(miniPlaylist);
    } catch (error) {
        console.error("Error generating mini-playlist:", error);
        res.status(500).send("Error generating mini-playlist");
    }
});

app.get('/load/:id', async (req, res) => {
  const playlistId = req.params.id;

  // Fetch playlist data using the correct function
  try {
      const playlistData = await fetchPlaylistData(playlistId);

      if (!playlistData) {
          console.log("No data returned for playlist ID:", playlistId);
          return res.status(500).send("Error loading playlist data.");
      }

      const graph = buildGraph(playlistData);
      res.json(graph);  // Send the graph to the frontend or CLI
  } catch (error) {
      console.error("Error loading playlist:", error);
      res.status(500).send("Error loading playlist.");
  }
});

app.get('/traverse/:algorithm', async (req, res) => {
  const { algorithm } = req.params;
  const { playlistId, startGenre, limit } = req.query;

  console.log("Request received:", { algorithm, playlistId, startGenre });


  if (!playlistId) {
    console.error("Missing playlist ID");
    return res.status(400).json({ error: "Playlist ID is missing." });
  }

  try {
    const playlistData = await fetchPlaylistData(playlistId);
    const graph = buildGraph(playlistData);
    
    // Calculate the top 10 genres with the most songs
    const genreCounts = Object.keys(graph)
    .map((genre) => ({ genre, count: graph[genre].length })) // Map genres to their counts
    .sort((a, b) => b.count - a.count); // Sort by count descending

   const availableGenres = genreCounts.slice(0, 15).map((item) => item.genre); // Top 15 genres
   const topGenre = availableGenres[0];
  


    let traversalResults = [];
    if (algorithm === "dfs") {
      traversalResults = weightedDepthFirstSearch(graph, startGenre || "", parseInt(limit, 10));
    } else if (algorithm === "bfs") {
      traversalResults = weightedBreadthFirstSearch(graph, startGenre || "", parseInt(limit, 10));
    } else {
      console.error("Invalid algorithm:", algorithm);
      return res.status(400).json({ error: "Invalid algorithm specified." });
    }

    console.log("Traversal results:", traversalResults);
    res.json({ traversalResults, availableGenres, topGenre });

    console.log("Available Genres:", availableGenres);

  } catch (err) {
    console.error("Error during traversal:", err.message);
    res.status(500).json({ error: "Failed to fetch traversal results." });
  }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});