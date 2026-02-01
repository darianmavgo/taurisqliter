use tauri::State;
use crate::state::AppState;
use crate::error::CommandResult;
use crate::db;

#[tauri::command]
pub async fn open_database_dialog(app: tauri::AppHandle) -> CommandResult<Option<String>> {
    use tauri_plugin_dialog::DialogExt;
    let file = app.dialog().file().blocking_pick_file();
    Ok(file.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn connect_db(path: String, state: State<'_, AppState>) -> CommandResult<bool> {
    db::connect(path, &state.db)
}

#[tauri::command]
pub async fn get_tables(state: State<'_, AppState>) -> CommandResult<Vec<String>> {
    db::get_tables(&state.db)
}

#[tauri::command]
pub async fn get_table_rows(table: String, limit: Option<i64>, offset: Option<i64>, state: State<'_, AppState>) -> CommandResult<serde_json::Value> {
    db::get_table_rows(table, limit, offset, &state.db)
}
