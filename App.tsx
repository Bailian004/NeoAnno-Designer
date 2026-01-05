import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { Designer } from './components/Designer';
import { AnnoTitle } from './types';

function App() {
  const [selectedGame, setSelectedGame] = useState<AnnoTitle | null>(null);

  if (selectedGame) {
    return (
      <Designer 
        gameTitle={selectedGame} 
        onBack={() => setSelectedGame(null)} 
      />
    );
  }

  return (
    <HomePage onSelectGame={setSelectedGame} />
  );
}

export default App;
