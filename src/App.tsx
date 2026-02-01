import { useState } from 'react';
import ConnectScreen from './components/ConnectScreen';
import TableBrowser from './components/TableBrowser';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="app-container">
      {!isConnected ? (
        <ConnectScreen onConnected={() => setIsConnected(true)} />
      ) : (
        <TableBrowser onDisconnect={() => setIsConnected(false)} />
      )}
    </div>
  );
}

export default App;
