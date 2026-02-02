mod commands;
mod db;
mod error;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::open_database_dialog,
            commands::connect_db,
            commands::get_tables,
            commands::get_table_rows,
            commands::get_input_mappings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
