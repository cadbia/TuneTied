// BACKEND FOR SPOTIFY API REQUESTS
// To run server call 'node index.js' from command line
// To stop server ^C

const express = require('express'); 
const axios = require('axios'); // Axios for making HTTP requests
const dotenv = require('dotenv'); // Dotenv for managing environment variables
const querystring = require('querystring'); // For parsing querystrings

// Load environment variables from .env file
dotenv.config();

// Consts for Spotify API credentials
const CLIENT_ID = process.env.CLIENT_ID; 
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const PORT = 3000; // Server port

// Init Express application
const app = express();

// Var to store access token
let accessToken = null;

// Var to store state (a security measure)
let storedState = null;


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
    var code = req.query.code || null; // Extract auth code from query string
    var state = req.query.state || null; // Extract state param from query string
  
    // Check for state mismatch
    if (state === null) {
        res.redirect('/#' +
        querystring.stringify({
            error: 'state_mismatch'
        }));
    } else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token', // Spotify's token endpoint
            form: {
                code: code, // Authorization code from Spotify
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')), // Client credentials in base64
        },
        json: true, // Parse response as JSON
        };
    }
  
    // POST request to Spotify's token endpoint
    const response = await axios.post(authOptions.url, authOptions.form, {
        headers: authOptions.headers,
    });

    // Extract access and refresh tokens from response
    accessToken = response.data.access_token;
    const { refresh_token, expires_in } = response.data;

    res.send('Authorization successful! Can now fetch your playlists at /playlists.');
    
    // console.log('Access Token:', accessToken);
    // console.log('Refresh Token:', refresh_token);
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

    const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });
  
    // Extract unique artist IDs from playlist
    const artistIds = [
    ...new Set(
        tracksResponse.data.items
        .filter((item) => item.track) // Ensure valid track object
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
    const tracks = tracksResponse.data.items
        .filter((item) => item.track) // Ensure valid track object
        .map((item) => ({
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
  
// Start server

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});