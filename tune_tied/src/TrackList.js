import React from 'react';

function TrackList({ tracks }) {
  return (
    <div>
      <h2>Tracks:</h2>
      <ul>
        {tracks.map((track, index) => (
          <li key={index}>
            <strong>{track.name}</strong> by {track.artist} ({track.album})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrackList;
