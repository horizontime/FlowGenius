import { INote, INoteEntry } from "@/shared/types";
import sqlite3 from "sqlite3";
const db = new sqlite3.Database('notes.sql');

const create_tables = () => {
    db.serialize(() => {
        // // Drop existing tables to start fresh
        // db.run("DROP TABLE IF EXISTS notes", (err) => {
        //     if (err) console.error("Error dropping notes table:", err);
        // });
        
        // Create notes table
        db.run(`CREATE TABLE IF NOT EXISTS notes (
            id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )`, (err) => {
            if (err) console.error("Error creating notes table:", err);
        });
        
        // Migration: Add summary and tags columns to existing notes table if they don't exist
        db.run(`PRAGMA table_info(notes)`, (err: any, rows: any) => {
            if (err) {
                console.error("Error checking table info:", err);
                return;
            }
            db.all(`PRAGMA table_info(notes)`, (err: any, columns: any[]) => {
                if (err) {
                    console.error("Error getting table columns:", err);
                    return;
                }
                
                const hasSummaryColumn = columns.some(col => col.name === 'summary');
                const hasTagsColumn = columns.some(col => col.name === 'tags');
                const hasStudyPlanColumn = columns.some(col => col.name === 'study_plan');
                
                if (!hasSummaryColumn) {
                    db.run(`ALTER TABLE notes ADD COLUMN summary TEXT`, (err: any) => {
                        if (err) {
                            console.error("Error adding summary column:", err);
                        } else {
                            console.log("Summary column added to existing notes table");
                        }
                    });
                }
                
                if (!hasTagsColumn) {
                    db.run(`ALTER TABLE notes ADD COLUMN tags TEXT`, (err: any) => {
                        if (err) {
                            console.error("Error adding tags column:", err);
                        } else {
                            console.log("Tags column added to existing notes table");
                        }
                    });
                }
                
                if (!hasStudyPlanColumn) {
                    db.run(`ALTER TABLE notes ADD COLUMN study_plan TEXT`, (err: any) => {
                        if (err) {
                            console.error("Error adding study_plan column:", err);
                        } else {
                            console.log("Study plan column added to existing notes table");
                        }
                    });
                }
            });
        });
        
        // Create note_entries table
        db.run(`CREATE TABLE IF NOT EXISTS note_entries (
            id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            heading TEXT NOT NULL,
            body TEXT,
            order_index INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Error creating note_entries table:", err);
        });
    });
}

// Initialize tables
create_tables();

export const create_note = (title: string, summary: string = "", callback: Function) => {
    db.serialize(() => {
        const now = Date.now();
        db.run(
            "INSERT INTO notes (title, summary, study_plan, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            [title, summary, "", JSON.stringify([]), now, now],
            function(err) {
                if (err) {
                    console.error("Error creating note:", err);
                    callback(null);
                    return;
                }
                
                const noteId = this.lastID;
                // Create a default entry for the new note
                db.run(
                    "INSERT INTO note_entries (note_id, heading, body, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    [noteId, "New Entry", "", 0, now, now],
                    (err) => {
                        if (err) {
                            console.error("Error creating note entry:", err);
                        }
                        get_all_notes(callback);
                    }
                );
            }
        );
    });
}

export const update_note = (note: INote, callback: Function) => {
    db.serialize(() => {
        const now = Date.now();
        db.run(
            "UPDATE notes SET title = ?, summary = ?, study_plan = ?, tags = ?, updated_at = ? WHERE id = ?",
            [note.title, note.summary || "", note.study_plan || "", JSON.stringify(note.tags || []), now, note.id],
            (err) => {
                if (err) {
                    console.error("Error updating note:", err);
                    callback(null);
                    return;
                }
                get_all_notes(callback);
            }
        );
    });
}

export const delete_note = (noteId: number, callback: Function) => {
    db.serialize(() => {
        // First delete all entries for this note
        db.run("DELETE FROM note_entries WHERE note_id = ?", [noteId], (err) => {
            if (err) {
                console.error("Error deleting note entries:", err);
            }
            
            // Then delete the note itself
            db.run("DELETE FROM notes WHERE id = ?", [noteId], (err) => {
                if (err) {
                    console.error("Error deleting note:", err);
                    callback(null);
                    return;
                }
                get_all_notes(callback);
            });
        });
    });
}

export const get_all_notes = (callback: Function) => {
    db.serialize(() => {
        db.all(
            "SELECT * FROM notes ORDER BY created_at DESC",
            (err, notes: INote[]) => {
                if (err) {
                    console.error("Error getting notes:", err);
                    callback([]);
                    return;
                }
                
                // Get entries for each note
                const notesWithEntries: INote[] = [];
                let completed = 0;
                
                if (notes.length === 0) {
                    callback([]);
                    return;
                }
                
                notes.forEach((note) => {
                    // Parse tags from JSON string
                    try {
                        note.tags = note.tags ? JSON.parse((note.tags as unknown) as string) : [];
                    } catch (e) {
                        console.error("Error parsing tags:", e);
                        note.tags = [];
                    }
                    
                    db.all(
                        "SELECT * FROM note_entries WHERE note_id = ? ORDER BY order_index",
                        [note.id],
                        (err, entries: INoteEntry[]) => {
                            if (err) {
                                console.error("Error getting entries:", err);
                                note.entries = [];
                            } else {
                                note.entries = entries;
                            }
                            
                            notesWithEntries.push(note);
                            completed++;
                            
                            if (completed === notes.length) {
                                callback(notesWithEntries);
                            }
                        }
                    );
                });
            }
        );
    });
}

export const get_note_with_entries = (noteId: number, callback: Function) => {
    db.serialize(() => {
        db.get(
            "SELECT * FROM notes WHERE id = ?",
            [noteId],
            (err, note: INote) => {
                if (err || !note) {
                    console.error("Error getting note:", err);
                    callback(null);
                    return;
                }
                
                // Parse tags from JSON string
                try {
                    note.tags = note.tags ? JSON.parse((note.tags as unknown) as string) : [];
                } catch (e) {
                    console.error("Error parsing tags:", e);
                    note.tags = [];
                }
                
                db.all(
                    "SELECT * FROM note_entries WHERE note_id = ? ORDER BY order_index",
                    [noteId],
                    (err, entries: INoteEntry[]) => {
                        if (err) {
                            console.error("Error getting entries:", err);
                            note.entries = [];
                        } else {
                            note.entries = entries;
                        }
                        callback(note);
                    }
                );
            }
        );
    });
}

export const create_note_entry = (noteId: number, heading: string, body: string, callback: Function) => {
    db.serialize(() => {
        // Get the current max order_index for this note
        db.get(
            "SELECT MAX(order_index) as max_order FROM note_entries WHERE note_id = ?",
            [noteId],
            (err, result: any) => {
                const orderIndex = (result?.max_order ?? -1) + 1;
                const now = Date.now();
                
                db.run(
                    "INSERT INTO note_entries (note_id, heading, body, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    [noteId, heading, body, orderIndex, now, now],
                    (err) => {
                        if (err) {
                            console.error("Error creating note entry:", err);
                            callback(null);
                            return;
                        }
                        
                        get_note_with_entries(noteId, callback);
                    }
                );
            }
        );
    });
}

export const update_note_entry = (entry: INoteEntry, callback: Function) => {
    db.serialize(() => {
        const now = Date.now();
        db.run(
            "UPDATE note_entries SET heading = ?, body = ?, updated_at = ? WHERE id = ?",
            [entry.heading, entry.body, now, entry.id],
            (err) => {
                if (err) {
                    console.error("Error updating note entry:", err);
                    callback(null);
                    return;
                }
                
                get_note_with_entries(entry.note_id, callback);
            }
        );
    });
}

export const delete_note_entry = (entryId: number, noteId: number, callback: Function) => {
    db.serialize(() => {
        db.run(
            "DELETE FROM note_entries WHERE id = ?",
            [entryId],
            (err) => {
                if (err) {
                    console.error("Error deleting note entry:", err);
                    callback(null);
                    return;
                }
                
                // Return the updated note and indicate that tags should be regenerated
                get_note_with_entries(noteId, (note: INote) => {
                    callback(note, { shouldRegenerateTags: true });
                });
            }
        );
    });
}

export const reorder_note_entries = (noteId: number, entryIds: number[], callback: Function) => {
    db.serialize(() => {
        let completed = 0;
        
        entryIds.forEach((entryId, index) => {
            db.run(
                "UPDATE note_entries SET order_index = ? WHERE id = ? AND note_id = ?",
                [index, entryId, noteId],
                (err) => {
                    if (err) {
                        console.error("Error reordering entry:", err);
                    }
                    
                    completed++;
                    if (completed === entryIds.length) {
                        get_note_with_entries(noteId, callback);
                    }
                }
            );
        });
    });
}

export const update_note_tags = (noteId: number, tags: string[], callback: Function) => {
    db.serialize(() => {
        const now = Date.now();
        db.run(
            "UPDATE notes SET tags = ?, updated_at = ? WHERE id = ?",
            [JSON.stringify(tags), now, noteId],
            (err) => {
                if (err) {
                    console.error("Error updating note tags:", err);
                    callback(null);
                    return;
                }
                get_note_with_entries(noteId, callback);
            }
        );
    });
}

// db.close();