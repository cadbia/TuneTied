// BACKEND FOR SPOTIFY API REQUESTS
// To run server call 'node index.js' from command line
// To stop server ^C


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
