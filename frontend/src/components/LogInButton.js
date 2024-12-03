import React from 'react';

const LoginButton = () => {
  const handleLogin = () => {
    // sends the user to the backend route /login
    window.location.href = 'http://localhost:3000/login';
  };

  return (
    // make a button thats clickable
    <button onClick={handleLogin}>
      Log in with Spotify Here
    </button>
  );
};

export default LoginButton;
