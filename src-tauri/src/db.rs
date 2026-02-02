use std::path::Path;
use std::sync::Mutex;
use rusqlite::Connection;
use crate::error::{CommandResult, CommandError};

// Initialize App.db with default mappings
pub fn init_app_db(path: &str) -> CommandResult<()> {
    let conn = Connection::open(path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS keyboard_map (
            action TEXT PRIMARY KEY,
            keys TEXT NOT NULL -- Comma separated keys
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS gamepad_map (
            action TEXT PRIMARY KEY,
            input_type TEXT NOT NULL, -- 'button' or 'axis'
            index_id INTEGER NOT NULL,
            scale REAL DEFAULT 1.0
        )",
        [],
    )?;

    // Seed defaults if empty
    let count: i64 = conn.query_row("SELECT count(*) FROM keyboard_map", [], |row| row.get(0))?;
    if count == 0 {
        let kb_defaults = vec![
            ("forward", "KeyW,ArrowUp"),
            ("backward", "KeyS,ArrowDown"),
            ("left", "KeyA,ArrowLeft"),
            ("right", "KeyD,ArrowRight"),
            ("jump", "Space"),
            ("boost", "ShiftLeft"),
        ];
        for (act, keys) in kb_defaults {
            conn.execute("INSERT INTO keyboard_map (action, keys) VALUES (?1, ?2)", (act, keys))?;
        }
    }

    let count_gp: i64 = conn.query_row("SELECT count(*) FROM gamepad_map", [], |row| row.get(0))?;
    if count_gp == 0 {
        let gp_defaults = vec![
            ("throttle", "axis", 1, -1.0), // Left Stick Y inverted
            ("steer", "axis", 0, -1.0),   // Left Stick X inverted logic in code? No, usually Left=-1, Right=1. Car logic expects Left=Positive torque usually? 
            // In Car.tsx: Left(-1) -> turn left(+1 torque). So scale should be -1 if stick is normal.
            ("jump", "button", 0, 1.0),    // A / Cross
            ("boost", "button", 5, 1.0),   // R1 / RB
        ];
        // Note: For 'steer', standard gamepad: Left is -1.0, Right is 1.0. 
        // Our car logic: `if (controls.left) steerInput += 1`.
        // `steerInput = -axisX`. So if axis is -1 (Left), steerInput becomes 1 (Turn Left).
        // So scale should be -1.0.

        for (act, type_, idx, scale) in gp_defaults {
             conn.execute("INSERT INTO gamepad_map (action, input_type, index_id, scale) VALUES (?1, ?2, ?3, ?4)", (act, type_, idx, scale))?;
        }
    }

    Ok(())
}

pub fn get_mappings(db_state: &Mutex<Option<Connection>>) -> CommandResult<serde_json::Value> {
    let lock = db_state.lock().unwrap();
    let conn = lock.as_ref().ok_or_else(|| CommandError::Other("No DB".to_string()))?;

    // Keyboard
    let mut stmt = conn.prepare("SELECT action, keys FROM keyboard_map")?;
    let kb_rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut kb_map = std::collections::HashMap::new();
    for r in kb_rows {
        let (act, keys) = r?;
        kb_map.insert(act, keys);
    }

    // Gamepad
    let mut stmt = conn.prepare("SELECT action, input_type, index_id, scale FROM gamepad_map")?;
    let gp_rows = stmt.query_map([], |row| {
         Ok((
            row.get::<_, String>(0)?,
            serde_json::json!({
                "type": row.get::<_, String>(1)?,
                "index": row.get::<_, i64>(2)?,
                "scale": row.get::<_, f64>(3)?
            })
         ))
    })?;
    let mut gp_map = std::collections::HashMap::new();
    for r in gp_rows {
        let (act, data) = r?;
        gp_map.insert(act, data);
    }

    Ok(serde_json::json!({
        "keyboard": kb_map,
        "gamepad": gp_map
    }))
}

pub fn connect(path: String, db_state: &Mutex<Option<Connection>>) -> CommandResult<bool> {
    let conn = Connection::open(path)?;
    let mut lock = db_state.lock().unwrap();
    *lock = Some(conn);
    Ok(true)
}

pub fn get_tables(db_state: &Mutex<Option<Connection>>) -> CommandResult<Vec<String>> {
    let lock = db_state.lock().unwrap();
    let conn = lock.as_ref().ok_or_else(|| crate::error::CommandError::Other("No database connected".to_string()))?;
    
    let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")?;
    let rows = stmt.query_map([], |row| row.get(0))?;
    
    let mut tables = Vec::new();
    for table in rows {
        tables.push(table?);
    }
    Ok(tables)
}

pub fn get_table_rows(table: String, limit: Option<i64>, offset: Option<i64>, db_state: &Mutex<Option<Connection>>) -> CommandResult<serde_json::Value> {
    let lock = db_state.lock().unwrap();
    let conn = lock.as_ref().ok_or_else(|| crate::error::CommandError::Other("No database connected".to_string()))?;
    
    // SAFETY: Still string replacement for table name, be careful.
    let limit_clause = match limit {
        Some(l) => format!("LIMIT {}", l),
        None => "LIMIT -1".to_string(),
    };
    let offset_clause = match offset {
        Some(o) => format!("OFFSET {}", o),
        None => "".to_string(),
    };

    let query = format!("SELECT * FROM \"{}\" {} {}", table.replace("\"", "\"\""), limit_clause, offset_clause);
    
    let mut stmt = conn.prepare(&query)?;
    let column_count = stmt.column_count();
    let column_names: Vec<String> = stmt.column_names().into_iter().map(|s| s.to_string()).collect();
    
    let mut rows = stmt.query([])?;
    let mut result_rows = Vec::new();
    
    while let Some(row) = rows.next()? {
        let mut row_map = serde_json::Map::new();
        for i in 0..column_count {
            let val = row.get_ref(i)?;
            let json_val = match val {
                rusqlite::types::ValueRef::Null => serde_json::Value::Null,
                rusqlite::types::ValueRef::Integer(i) => serde_json::Value::Number(i.into()),
                rusqlite::types::ValueRef::Real(f) => serde_json::Number::from_f64(f).map(serde_json::Value::Number).unwrap_or(serde_json::Value::Null),
                rusqlite::types::ValueRef::Text(t) => serde_json::Value::String(String::from_utf8_lossy(t).to_string()),
                rusqlite::types::ValueRef::Blob(_) => serde_json::Value::String("<BLOB>".to_string()),
            };
            row_map.insert(column_names[i].clone(), json_val);
        }
        result_rows.push(serde_json::Value::Object(row_map));
    }
    
    Ok(serde_json::json!({
        "columns": column_names,
        "rows": result_rows
    }))
}
