# Tauri SQLite Browser - Implementation Plan

## Goal Description
Create a local, "pure" Tauri application for browsing SQLite databases. This app will not rely on external server binaries but will instead use Rust and Tauri's native capabilities for high performance and tight system integration.

## Core Philosophy: "Idiomatic Tauri"
- **No Sidecars**: Logic lives in Rust crate, not a separate process.
- **Async Commands**: Heavy I/O (database queries) happens on thread pool, not blocking the UI.
- **State Management**: Use Tauri's `manage` to hold database connections.
- **Security**: Strict allowlists for file access.
- **Frontend Agnostic, but Opinionated**: React + Vite for specific UI implementation, communicating via `invoke`.

## Architecture

### Backend (Rust / Tauri)
- **Crates**:
  - `tauri`: Core framework.
  - `rusqlite`: For synchronous SQLite access (wrapped in async commands).
  - `serde`, `serde_json`: Serialization.
- **Modules**:
  - `db`: Handles connection pooling and raw query execution.
  - `commands`: Exposed Tauri commands (`open_db`, `query`, `get_schema`).
  - `state`: Application state (currently open file context).

### Frontend (React + Vite)
- **Components**:
  - `App`: Main layout.
  - `ConnectionScreen`: File picker wrapper.
  - `TableBrowser`: Main view with grid.
  - `QueryEditor`: Raw SQL execution.
- **Libraries**:
  - `@tanstack/react-query`: For managing async state from Tauri commands.
  - `ag-grid-react`: High performance data grid.
  - `lucide-react`: Icons.

## Detailed Features

### 1. File Access
Instead of a "server" opening a folder, we use the OS native dialog.
- **Command**: `open_database_dialog()`
- **Rust**: Uses `tauri::api::dialog`.
- **Result**: Returns path, frontend stores it, requests "connect".

### 2. Database Connection
- **Command**: `connect_db(path: String)`
- **Rust**:
    - Closes existing connection if any.
    - Opens new `rusqlite::Connection`.
    - Stores in `Mutex<Option<Connection>>` managed by Tauri state.

### 3. Data Browsing
- **Command**: `get_tables()`
- **Command**: `preview_table(table: String, limit: u32, offset: u32)`
    - Intelligently fetches chunks to avoid OOM.
    - Returns `{ columns: [], rows: [][] }`.

### 4. Raw SQL
- **Command**: `execute_sql(query: String)`
    - Returns result set or error.

## Roadmap

1.  **Initialize Project**: `npm run tauri init`.
2.  **Scaffold Rust**: Set up `AppState` and basic `rusqlite` integration.
3.  **Frontend Layout**: Sidebar for tables, main area for data.
4.  **Connect Flow**: Open file -> List Tables -> Click Table -> Render Grid.
5.  **Refinement**: Streaming/Pagination for large tables.

## Proposed Project Structure

```text
/src-tauri
  /src
    main.rs      # Entry point, setup
    commands.rs  # #[tauri::command] handlers
    db.rs        # SQLite wrappers
    error.rs     # Custom error types
  Cargo.toml
/src
  /components
  /hooks
  App.tsx
  main.tsx
```
