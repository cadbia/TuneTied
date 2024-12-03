import React from 'react';

function PlaylistDropdown({ playlists, onSelect }) {
  return (
    <div>
      <label htmlFor="playlist-select">Select a Playlist:</label>
      <select
        id="playlist-select"
        onChange={(e) => onSelect(e.target.value)} // Pass selected value to parent
      >
        <option value="">--Choose a Playlist--</option>
        {playlists.map((playlist) => (
          <option key={playlist.id} value={playlist.id}>
            {playlist.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PlaylistDropdown;
