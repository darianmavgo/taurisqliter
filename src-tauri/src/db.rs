use std::path::Path;
use std::sync::Mutex;
use rusqlite::Connection;
use crate::error::CommandResult;

pub fn connect<P: AsRef<Path>>(path: P, db_state: &Mutex<Option<Connection>>) -> CommandResult<bool> {
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
