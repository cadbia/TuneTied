# TuneTied: Curate Your Playlists by Genre and Mood

**TuneTied** is a application using the Spotify API to generate smaller playlists. It can fetch playlist data, build genre-based graphs, and perform graph traversal algorithms (DFS and BFS). 

---

## Features

- **Fetch Spotify Playlist Data:** Retrieve detailed information about tracks, artists, and genres from a given Spotify playlist.
- **Graph Construction:** Build a graph where genres are nodes connected by tracks.
- **Graph Traversal Algorithms:** Perform Depth-First Search (DFS) or Breadth-First Search (BFS) on the genre graph.
- **Terminal CLI:** Commands for loading playlists and traversing graphs directly in the terminal.

---

## Requirements

- **Node.js** (latest stable version recommended)
- **Spotify Developer Account** (for API credentials)
- **Environment Variables** configured in a `.env` file:
  - `CLIENT_ID` - Your Spotify App Client ID
  - `CLIENT_SECRET` - Your Spotify App Client Secret
  - `REDIRECT_URI` - Redirect URI configured in your Spotify App

---

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your Spotify API credentials:
   ```env
   CLIENT_ID=your-client-id
   CLIENT_SECRET=your-client-secret
   REDIRECT_URI=http://localhost:3000/callback
   ```

---

## Usage

### Start the Server
Run the following command in the TuneTied folder to start the server:
```bash
node index.js
```

The server will run at [http://localhost:3000](http://localhost:3000).

Run the following command in the **frontend** folder to open the front end:
```bash
npm start
```

Type **Y** if it asks to open another port for the front end.

---

### CLI Commands

- **Load a Playlist**: 
  ```bash
  load <playlistId>
  ```
  Fetches playlist data and builds the genre graph.

- **Perform DFS Traversal**:
  ```bash
  dfs <startGenre>
  ```
  Performs a Depth-First Search starting from the specified genre.

- **Perform BFS Traversal**:
  ```bash
  bfs <startGenre>
  ```
  Performs a Breadth-First Search starting from the specified genre.

- **Exit the CLI**:
  ```bash
  exit
  ```
  Exits the CLI.
