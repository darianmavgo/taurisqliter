import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule } from 'ag-grid-community'; 
import { ArrowLeft, Table as TableIcon, RefreshCw } from 'lucide-react';
import './TableBrowser.css';

// Register AG Grid modules
ModuleRegistry.registerModules([ ClientSideRowModelModule, ValidationModule ]);

interface TableData {
  columns: string[];
  rows: any[];
}

export default function TableBrowser({ onDisconnect }: { onDisconnect: () => void }) {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Initial blocking load
  const [isStreaming, setIsStreaming] = useState(false); // Background non-blocking load
  const [rowData, setRowData] = useState<any[]>([]);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      // Clear previous data
      setRowData([]);
      setColDefs([]);
      
      const INITIAL_LIMIT = 1000;
      const CHUNK_SIZE = 5000;
      let active = true;

      const load = async () => {
        setLoading(true);
        try {
          // Initial load
          const initResult = await invoke<TableData>('get_table_rows', { 
            table: selectedTable, 
            limit: INITIAL_LIMIT, 
            offset: 0 
          });
          
          if (!active) return;

          // Set initial view
          setRowData(initResult.rows);
          setColDefs(initResult.columns.map(col => ({ field: col, filter: true, sortable: true })));
          setLoading(false); // Unblock UI immediately after first chunk

          // If we got full page, try to fetch rest in background
          if (initResult.rows.length === INITIAL_LIMIT) {
             setIsStreaming(true);
             let currentOffset = INITIAL_LIMIT;
             
             const fetchNextChunk = async () => {
               if (!active) return;
               
               const chunk = await invoke<TableData>('get_table_rows', {
                 table: selectedTable,
                 limit: CHUNK_SIZE,
                 offset: currentOffset
               });

               if (!active) return;

               if (chunk.rows.length > 0) {
                 setRowData(prev => [...prev, ...chunk.rows]);
                 currentOffset += chunk.rows.length;
                 // Continue fetching if we got a full chunk
                 if (chunk.rows.length === CHUNK_SIZE) {
                    setTimeout(fetchNextChunk, 50);
                 } else {
                   setIsStreaming(false);
                 }
               } else {
                 setIsStreaming(false);
               }
             };
             fetchNextChunk();
          }

        } catch (e) {
          console.error(e);
          setLoading(false);
          setIsStreaming(false);
        }
      };

      load();

      return () => { active = false; };
    }
  }, [selectedTable]);

  async function fetchTables() {
    try {
      const result = await invoke<string[]>('get_tables');
      setTables(result);
      if (result.length > 0 && !selectedTable) {
        setSelectedTable(result[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="browser-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Tables</h2>
          <button onClick={fetchTables} title="Refresh Tables" className="icon-btn">
            <RefreshCw size={16} />
          </button>
        </div>
        <ul className="table-list">
          {tables.map(t => (
            <li 
              key={t} 
              className={selectedTable === t ? 'active' : ''}
              onClick={() => setSelectedTable(t)}
            >
              <TableIcon size={14} />
              {t}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button onClick={onDisconnect} className="disconnect-btn"> 
            <ArrowLeft size={16} /> Close DB
          </button>
        </div>
      </div>
      
      <div className="main-content">
        {selectedTable ? (
          <>
            <div className="table-header">
              <h3>{selectedTable}</h3>
              <div className="header-stats">
                <span className="row-count">{rowData.length} rows</span>
                {isStreaming && <span className="streaming-indicator">Loading more...</span>}
              </div>
            </div>
            <div className="grid-wrapper ag-theme-quartz-dark">
              <AgGridReact
                rowData={rowData}
                columnDefs={colDefs}
                loading={loading}
                defaultColDef={{ flex: 1, minWidth: 100 }}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">Select a table to view data</div>
        )}
      </div>
    </div>
  );
}
