// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import { INoteData } from "./shared/types";
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
    set_note: async (data: any, explicit=false): Promise<INoteData[]> => {
        const notes = await ipcRenderer.invoke('set-note', data)
        console.log("notes", notes);
        if (explicit) {
            window.dispatchEvent(broadcast_event('all-notes-data', notes));
            return;
        }
        return notes;        
    },
    fetch_all_notes: async () => {
        const all_notes = await ipcRenderer.invoke('fetch-all-notes')
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
    },
    delete_note: async (note_id: string) => {
        const all_notes = await ipcRenderer.invoke('delete-note', note_id)
        window.dispatchEvent(broadcast_event('all-notes-data', all_notes));
    },
    get_note: async (note_id: string) => {
        return await ipcRenderer.invoke('get-note', note_id)
    },
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