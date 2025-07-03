// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { INote, INoteEntry } from "./shared/types";
import {broadcast_event} from './shared/events'

ipcRenderer.on('onstart-notes-data', (ev, data) => {
    document.onreadystatechange = (ev) => {
        console.log("event onreadystatechange", ev);     
        setTimeout(() => {
            window.dispatchEvent(broadcast_event('all-notes-data', data));                    
        }, 0);   
    }
})

ipcRenderer.on('update-notes-data', (ev, data) => {
    window.dispatchEvent(broadcast_event('all-notes-data', data));                    
})

const renderer = {
    closeApp: () => {
        ipcRenderer.send('close-app')
    },
    maximizeApp: () => {
        ipcRenderer.send('maximize-app')
    },
    minimizeApp: () => {
        ipcRenderer.send('minimize-app')
    },
    
    // Note operations
    create_note: async (title: string): Promise<INote[]> => {
        const notes = await ipcRenderer.invoke('create-note', title)
        window.dispatchEvent(broadcast_event('all-notes-data', notes));
        return notes;        
    },
    update_note: async (note: INote): Promise<INote[]> => {
        const notes = await ipcRenderer.invoke('update-note', note)
        window.dispatchEvent(broadcast_event('all-notes-data', notes));
        return notes;        
    },
    delete_note: async (noteId: number): Promise<INote[]> => {
        const all_notes = await ipcRenderer.invoke('delete-note', noteId)
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
        return all_notes;
    },
    fetch_all_notes: async () => {
        const all_notes = await ipcRenderer.invoke('fetch-all-notes')
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
    },
    get_note_with_entries: async (noteId: number): Promise<INote> => {
        return await ipcRenderer.invoke('get-note-with-entries', noteId)
    },
    
    // Note entry operations
    create_note_entry: async (noteId: number, heading: string, body: string): Promise<INote> => {
        const note = await ipcRenderer.invoke('create-note-entry', noteId, heading, body)
        // The main process already calls get_all_notes in the callback, so we need to fetch fresh data
        const all_notes = await ipcRenderer.invoke('fetch-all-notes')
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
        return note;
    },
    update_note_entry: async (entry: INoteEntry): Promise<INote> => {
        const note = await ipcRenderer.invoke('update-note-entry', entry)
        // Only fetch all notes if the update was successful, and do it in the background
        if (note) {
            // Use setTimeout to make this async and non-blocking
            setTimeout(async () => {
                const all_notes = await ipcRenderer.invoke('fetch-all-notes')
                window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
            }, 0);
        }
        return note;
    },
    delete_note_entry: async (entryId: number, noteId: number): Promise<INote> => {
        const result = await ipcRenderer.invoke('delete-note-entry', entryId, noteId)
        const note = result.note || result; // Handle both old and new response formats
        const shouldRegenerateTags = result.shouldRegenerateTags || false;
        
        // Broadcast the updated notes
        const all_notes = await ipcRenderer.invoke('fetch-all-notes')
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
        
        // Trigger tag regeneration if needed
        if (shouldRegenerateTags && note) {
            window.dispatchEvent(broadcast_event('regenerate-tags', { noteId: note.id }));
        }
        
        return note;
    },
    reorder_note_entries: async (noteId: number, entryIds: number[]): Promise<INote> => {
        const note = await ipcRenderer.invoke('reorder-note-entries', noteId, entryIds)
        const all_notes = await ipcRenderer.invoke('fetch-all-notes')
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
        return note;
    },
    update_note_tags: async (noteId: number, tags: string[]): Promise<INote> => {
        const note = await ipcRenderer.invoke('update-note-tags', noteId, tags)
        // Fetch fresh data to update the UI
        const all_notes = await ipcRenderer.invoke('fetch-all-notes')
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
        return note;
    },
    
    // AI workflow operations
    process_note_entry_with_ai: async (noteTitle: string, entryHeading: string, apiKey?: string): Promise<string | null> => {
        return await ipcRenderer.invoke('process-note-entry-with-ai', noteTitle, entryHeading, apiKey);
    },

    // AI summarization operations
    summarize_note: async (noteId: number, summary: string): Promise<INote[]> => {
        return await ipcRenderer.invoke('summarize-note', noteId, summary);
    },

    // AI study plan operations
    generate_study_plan: async (noteId: number, studyPlan: string): Promise<INote[]> => {
        return await ipcRenderer.invoke('generate-study-plan', noteId, studyPlan);
    },
    
    // Legacy functions for backward compatibility (if needed)
    open_note_in_child_proc: (note_id: string) => {
        ipcRenderer.send('open-note-in-child-process', note_id)
    },
    open_note_item_context_menu: (note_id: string) => {
        console.log("note_id", note_id);
        
        ipcRenderer.send('open_note_item_context_menu', note_id)
    },
}

contextBridge.exposeInMainWorld('electron', renderer)

export type IRenderer = typeof renderer