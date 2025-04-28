import React from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { NotesList, WindowButtons } from '@/assets/SharedComponents';
import Editor from './Editor';
import { useMainStore } from '@/shared/zust-store';
import EmptyNoteUI from './EmptyNoteUI';
import { INoteData, TNote } from '@/shared/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sectionize_notes } from '@/shared/functions';
import { PenBox, Trash } from 'lucide-react';
import { Switch } from "@/components/ui/switch"


const sort_notes = (a: INoteData,b:INoteData) => {
    return (JSON.parse(b.note as string) as TNote).time - (JSON.parse(a.note as string) as TNote).time
}

export default React.memo((props: any) => {
    const active_note = useMainStore(state => state.active_note);
    const notes = useMainStore(state => state.notes);
    const set_state = useMainStore(state => state.set_state);
    const [dark_mode, set_dark_mode] = React.useState<boolean>(localStorage.getItem('dark_mode') == 'dark')
    // const [notes, set_notes] = React.useState<INoteData[]>([]);
    const section_notes = React.useMemo(() => sectionize_notes(notes), [notes])

    const handle_create_new_note = React.useCallback(async () => {
        const dummy_data = {
            id: null,
            note: '{}'
        } as INoteData

        const notes = await window.electron.set_note(dummy_data)
        const sorted_note = notes.sort(sort_notes)
        set_state('active_note', sorted_note[0])
        set_state('notes', sorted_note)
    }, []);

    const handle_set_active_note = React.useCallback((note: INoteData) => {
        console.log(note)
        set_state('active_note', note)
    }, [])

    const handleToggleDarkMode = React.useCallback(() => {
        const isDark = document.documentElement.classList.contains('dark')
        localStorage.setItem('dark_mode', isDark ? 'light' : 'dark')
        set_dark_mode(!isDark)
        isDark ? document.documentElement.classList.remove('dark') : 
            document.documentElement.classList.add('dark')
    }, [])

    const handle_delete_note = React.useCallback(() => {
        if (confirm("Are you sure you want to delete this note, this action is irreversible")) {
            window.electron.delete_note(active_note.id.toString())
        }
    }, [active_note])

    React.useLayoutEffect(() => {
        window.addEventListener('all-notes-data', (ev: Event & {detail: INoteData[]}) => {
            console.log("ev", ev.detail);  
            const sorted_note = ev.detail.sort(sort_notes)
            ev.detail.length == 0 ? set_state('active_note', null) : set_state('active_note', sorted_note[0]);
            set_state('notes', sorted_note)
        });
    }, [])

    return (
        <div className='h-[100vh] w-[100%]'>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel minSize={30} defaultSize={35}>
                    <div className='h-[40px] w-[100%] border-b-[.5px] border-b-stone-300 dark:border-b-stone-800 app-dragger px-2 flex items-center justify-end'>
                        <span title="New note">
                            <PenBox onClick={handle_create_new_note} className='text-stone-900 dark:text-stone-100 h-[20px] cursor-pointer w-[20px]' />
                        </span>
                        {
                            notes.length > 0 &&
                            <span title="Delete note">
                                <Trash onClick={handle_delete_note} className='text-stone-900 dark:text-stone-100 h-[20px] cursor-pointer [&:hover]:text-red-600 w-[20px] ml-2' />
                            </span>
                        }
                    </div>
                    <ScrollArea className='h-[calc(100%-40px)]'>
                        {
                            notes.length == 0?
                            <div className='h-100 flex items-center justify-center text-xs text-stone-600 dark:text-stone-500'>
                                <span>No notes</span>
                            </div>:
                            Object.keys(section_notes).map(section => 
                                <NotesList key={Math.floor(Math.random() * 100000000000000)} onClick={handle_set_active_note} section={section} data={section_notes[section as keyof typeof section_notes]} />
                            )
                        }
                    </ScrollArea>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel minSize={30}>
                    <div className='h-[40px] px-2 w-[100%] border-b-[.5px] border-b-stone-300 dark:border-b-stone-800 app-dragger flex justify-between items-center'>
                        <div className='flex' onClick={handleToggleDarkMode}>
                            <small className='mr-2'>Dark mode</small>
                            <Switch checked={dark_mode} />
                        </div>
                        {
                            // !window.navigator.userAgent.toLowerCase().includes('mac') &&
                            <WindowButtons />
                        }
                    </div>
                    {
                        active_note == null ?
                        <EmptyNoteUI onClick={handle_create_new_note} />:
                        <Editor />                
                    }
                    
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
})