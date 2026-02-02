import { useState } from 'react';
import ConnectScreen from './components/ConnectScreen';
import TableBrowser from './components/TableBrowser';
import Game from './components/Game/Game';
import './App.css';

type AppMode = 'menu' | 'browser' | 'game';

function App() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
    setMode('browser');
  };

  return (
    <div className="app-container">
      {mode === 'menu' && (
        <div className="menu-screen">
          <h1>Tauri SQLiter & Game</h1>
          <div className="menu-buttons">
            <button onClick={() => setMode('browser')}>
              {isConnected ? 'Resume Browser' : 'Open Database Browser'}
            </button>
            <button onClick={() => setMode('game')}>
              Play Game
            </button>
          </div>
        </div>
      )}

      {mode === 'browser' && (
        !isConnected ? (
          <ConnectScreen onConnected={handleConnect} />
        ) : (
          <TableBrowser onDisconnect={() => setMode('menu')} />
        )
      )}

      {mode === 'game' && (
        <Game onExit={() => setMode('menu')} />
      )}
    </div>
  );
}

export default App;
