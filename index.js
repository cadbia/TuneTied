// BACKEND FOR SPOTIFY API REQUESTS
// To run server call 'node index.js' from command line
// To stop server ^C

/*
const express = require('express'); 
const axios = require('axios'); // Axios for making HTTP requests
const dotenv = require('dotenv'); // Dotenv for managing environment variables
const querystring = require('querystring'); // For parsing querystrings
const { depthFirstSearch, breadthFirstSearch } = require('./graphTraversal'); //functions for traversing the song genres

// Load environment variables from .env file
dotenv.config();

// Consts for Spotify API credentials
const CLIENT_ID = process.env.CLIENT_ID; 
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const PORT = 3000; // Server port

// Init Express application
const app = express();

const cors = require('cors'); // Import CORS

//app.use(cors()); // Enable CORS for all routes
app.use(cors({ origin: 'http://localhost:3001' }));

// Var to store access token
let accessToken = null;

// Var to store state (a security measure)
let storedState = null;

// Fetch playlist data from the API
async function fetchPlaylistData(playlistId) {
  try {
      const response = await axios.get(`http://localhost:3000/playlist/${playlistId}`);
      return response.data; // This is the array of tracks
  } catch (error) {
      console.error("Error fetching playlist data:", error);
  }
}

// Build the graph from playlist data
function buildGraph(data) {
  const graph = {};

  data.forEach((song) => {
      const genres = song.genres.split(', ').map((genre) => genre.trim());
      genres.forEach((genre) => {
          if (!graph[genre]) graph[genre] = [];
          graph[genre].push(song.name); // Link genre to songs
      });
  });

  return graph; // Graph with genres as edges and songs as nodes
}

// Find the most similar songs using BFS (or DFS)
function findSimilarSongs(graph, startGenre, limit = 10) {
  const similarSongs = breadthFirstSearch(graph, startGenre); // or depthFirstSearch
  return similarSongs.slice(0, limit); // Return up to 10 songs
}


// Root route - simple route to confirm server is running

app.get('/', (req, res) => {
    res.send('TuneTied Running!');
});


// Login route 
// https://developer.spotify.com/documentation/general/guides/authorization/
// https://developer.spotify.com/documentation/web-api/concepts/scopes#playlist-read-private

app.get('/login', (req, res) => {
    storedState = Math.random().toString(36).substring(2, 15); // Generate random state string

    var scope = 'playlist-read-private'; // Permission for accessing private playlists

    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: storedState
    })); 
  });

// Callback route - handles redirect from Spotify
// https://developer.spotify.com/documentation/web-api/tutorials/code-flow

app.get('/callback', async (req, res) => {
    var code = req.query.code || null;
    var state = req.query.state || null;
  
    // Check for state mismatch
    if (state === null) {
        res.redirect('http://localhost:3001/#error=state_mismatch');
        return;
    }
  
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')),
        },
        json: true,
    };
  
    try {
        // POST request to Spotify's token endpoint
        const response = await axios.post(authOptions.url, authOptions.form, {
            headers: authOptions.headers,
        });

        // Extract access and refresh tokens from response
        accessToken = response.data.access_token;
        const refresh_token = response.data.refresh_token;

        // Redirect back to frontend with a success message
        res.redirect('http://localhost:3001/playlists');
    } catch (error) {
        console.error('Error in callback:', error);
        res.redirect('http://localhost:3001/#error=authentication_failed');
    }
});

// Playlists route - Fetches the user's playlists from Spotify using access token
// https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists

app.get('/playlists', async (req, res) => {
    if (!accessToken) {
      // Check if user needs to login
      return res.status(401).send('Access token unavailable. Log in at /login.');
    }
  
      // GET request - fetch user's playlists
      const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorization header with access token
        },
      });
  
      // Safeguard against null values and/or missing properties
      const playlists = playlistsResponse.data.items
        .filter((playlist) => playlist && playlist.id && playlist.name && playlist.tracks) // Ensure each item is valid
        .map((playlist) => ({
          id: playlist.id, 
          name: playlist.name, 
          tracks: playlist.tracks.total,
        }));
  
      res.json(playlists); // Send formatted playlist JSON

  });


// Route to get all track objects from specific playlist
// Req the playlist ID from /playlists as a URL parameter
// https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks

app.get('/playlist/:id', async (req, res) => {
    const playlistId = req.params.id;
    // Check if user needs to login
    if (!accessToken) {
      return res.status(401).send('Access token unavailable. Log in at /login.');
    }

    let allTracks = []; // Arr to store all tracks
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`; // Initial URL for tracks

    // Loop through paginated results
    while (nextUrl) {
      const tracksResponse = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
 // Append the current set of tracks to the allTracks array (added this line)
 allTracks = allTracks.concat(
    tracksResponse.data.items.filter((item) => item.track) // Ensure valid track object
  );

  // Update nextUrl for the next set of tracks (added this line)
  nextUrl = tracksResponse.data.next;
}
  
  
    // Extract unique artist IDs from playlist
    const artistIds = [
    ...new Set(
        allTracks

        .flatMap((item) => item.track.artists.map((artist) => artist.id)) // Collect all artist IDs
    ),
    ];
  
      // Fetch artist details to retrieve genres
    const artistResponse = await axios.get('https://api.spotify.com/v1/artists', {
        params: { ids: artistIds.slice(0, 50).join(',') }, // Spotify limits 50 artist IDs per req
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
  
    // Map artist genres by artist ID for quick lookup
    const artistGenres = artistResponse.data.artists.reduce((acc, artist) => {
        acc[artist.id] = artist.genres;
        return acc;
    }, {});
  
    // Format track data
    const tracks = allTracks.map((item) => ({
            name: item.track.name, 
            artist: item.track.artists.map((artist) => artist.name).join(', '),
            album: item.track.album.name,
            duration_ms: item.track.duration_ms,
            genres: item.track.artists
                .flatMap((artist) => artistGenres[artist.id] || [])
                .join(', '),
            explicit: item.track.explicit,
            popularity: item.track.popularity,
            release_date: item.track.album.release_date,
            added_at: item.added_at,
    }));
   
 
    res.json(tracks); // Send formatted track data JSON
    // console.log(`Tracks fetched successfully for playlist ${playlistId}:`, tracks);
    
});

app.get('/traverse/dfs', (req, res) => {
  const { startNode } = req.query;
  const result = depthFirstSearch(graph, startNode || 'rock');
  res.json({ algorithm: 'DFS', result });
});

app.get('/traverse/bfs', (req, res) => {
  const { startNode } = req.query;
  const result = breadthFirstSearch(graph, startNode || 'rock');
  res.json({ algorithm: 'BFS', result });
});

// Endpoint to generate a mini playlist based on genre similarity
app.get('/mini-playlist/:id', async (req, res) => {
  const playlistId = req.params.id;
  const { startGenre } = req.query;  // Accept genre as a query parameter

  try {
      const playlistData = await fetchPlaylistData(playlistId);
      const graph = buildGraph(playlistData);  // Build the graph from playlist data
      const miniPlaylist = findSimilarSongs(graph, startGenre || 'rock');  // Get the mini playlist
      res.json(miniPlaylist);  // Send back the mini playlist
  } catch (error) {
      console.error("Error generating mini-playlist:", error);
      res.status(500).send("Error generating mini-playlist");
  }
});


  
// Start server

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
*/

// BACKEND FOR SPOTIFY API REQUESTS
// To run server call 'node index.js' from command line
// To stop server ^C

const express = require('express');
const axios = require('axios'); // Axios for making HTTP requests
const dotenv = require('dotenv'); // Dotenv for managing environment variables
const querystring = require('querystring'); // For parsing querystrings
const readline = require('readline'); // For terminal input
const { depthFirstSearch, breadthFirstSearch } = require('./graphTraversal'); // Traversal functions

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


// Build the graph from playlist data
function buildGraph(data) {
  const graph = {};

  data.forEach((song) => {
      // Ensure genre exists and is a string
      if (!song.genres || song.genres.trim() === '') {
          console.log(`Skipping song with missing or invalid genre: ${song.name}`);
          return; // Skip songs with invalid genres
      }

      const genres = song.genres.split(', ').map((genre) => genre.trim());
      genres.forEach((genre) => {
          if (!graph[genre]) graph[genre] = [];
          graph[genre].push(song.name);
      });
  });

  console.log("Built graph:", graph);  // Log the final graph
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
        const miniPlaylist = breadthFirstSearch(graph, startGenre || 'rock').slice(0, 10);
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
  const { playlistId, startGenre } = req.query; // Get playlistId and startGenre from query parameters

  if (!playlistId) {
    return res.status(400).json({ error: 'Playlist ID is missing.' });
  }

  try {
    const playlistData = await fetchPlaylistData(playlistId);
    const graph = buildGraph(playlistData);

    // Get all available genres from the graph
    const availableGenres = Object.keys(graph);

    let traversalResults = [];
    if (algorithm === 'dfs') {
      traversalResults = depthFirstSearch(graph, startGenre || 'rock');
    } else if (algorithm === 'bfs') {
      traversalResults = breadthFirstSearch(graph, startGenre || 'rock');
    } else {
      return res.status(400).json({ error: 'Invalid algorithm specified.' });
    }

    res.json({ traversalResults, availableGenres }); // Send both results and available genres
  } catch (err) {
    console.error('Error during traversal:', err);
    res.status(500).json({ error: 'Failed to fetch traversal results.' });
  }
});




// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
