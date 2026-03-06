import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ConnectScreen from './components/ConnectScreen';
import TableBrowser from './components/TableBrowser';
import Game from './components/Game/Game';
import GamepadTest from './components/GamepadTest';
import './App.css';

type AppMode = 'menu' | 'browser' | 'game' | 'test';

function App() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Attempt to connect to default App.db
    async function init() {
       try {
         const dbPath = "./App.db";
         const connected = await invoke('connect_db', { path: dbPath });
         if (connected) {
           setIsConnected(true);
           console.log("Connected to App.db");
         }
       } catch(e) {
         console.warn("Could not auto-connect App.db", e);
       }
    }
    init();
  }, []);

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
            <button onClick={() => setMode('test')}>
              Test Controller
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

      {mode === 'test' && (
        <GamepadTest onBack={() => setMode('menu')} />
      )}
    </div>
  );
}

export default App;
