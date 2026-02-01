import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Database, FolderOpen } from 'lucide-react';
import './ConnectScreen.css';

export default function ConnectScreen({ onConnected }: { onConnected: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setLoading(true);
    setError(null);
    try {
      const path = await invoke<string | null>('open_database_dialog');
      if (path) {
        const success = await invoke<boolean>('connect_db', { path });
        if (success) {
          onConnected();
        } else {
          setError("Failed to connect to database");
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="connect-container">
      <div className="card">
        <Database size={64} className="icon-main" />
        <h1>Tauri SQLiter</h1>
        <p>Open a local SQLite database to start browsing.</p>
        
        <button onClick={handleOpen} disabled={loading}>
          <FolderOpen size={18} style={{ marginRight: 8 }} />
          {loading ? 'Connecting...' : 'Open Database'}
        </button>
        
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
