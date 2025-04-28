import { INoteData } from "@/shared/types";
import sqlite3 from "sqlite3";
const db = new sqlite3.Database('notes.sql');

const create_notes_table = () => {
    db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, note TEXT)");
}

export const set_note = (data: INoteData, callback: Function) => {
    db.serialize(() => {
        create_notes_table()
    
        const stmt = db.prepare("INSERT OR REPLACE INTO notes (id,note) VALUES ((SELECT id FROM notes WHERE id = ?),?)");
        stmt.run(data.id, data.note);
        stmt.finalize();
        get_all_notes(callback)
    })
}

export const get_all_notes = (callback: Function) => {
    db.serialize(() => {
        create_notes_table()
        db.all("SELECT * FROM notes ORDER BY id DESC", (err, data) => {
            if (err) return null;
            callback(data)
        })
    })
}

export const get_note = (note_id: string, callback: Function) => {
    db.serialize(() => {
        create_notes_table()
        db.get("SELECT * FROM notes WHERE id="+note_id, (err, data) => {
            if (err) return null
            callback(data)
        })
    })
}

export const delete_note = (note_id: string, callback: Function) => {
    db.serialize(() => {
        create_notes_table()

        const stmt = db.prepare("DELETE FROM notes WHERE id=?");
        stmt.run(note_id);
        stmt.finalize();
        get_all_notes(callback)
    })
}

// db.close();