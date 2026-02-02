import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ConnectScreen from './components/ConnectScreen';
import TableBrowser from './components/TableBrowser';
import Game from './components/Game/Game';
import './App.css';

type AppMode = 'menu' | 'browser' | 'game';

function App() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Attempt to connect to default App.db
    async function init() {
       try {
         // Resolve App.db path relative to app? Or just use "App.db" which resolves to cwd or resource?
         // Since we run from project root, "App.db" creates it there.
         // Better: Use `resolveResource` or just local path.
         // For dev: use absolute path or local relative.
         // Let's try to connect to "./App.db".
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
