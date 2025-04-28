import { INoteData, TNote } from '@/shared/types';
import { Maximize, Minus, X } from 'lucide-react';
import React from 'react';
import {userFriendlyTime} from '../shared/functions'
import clsx from 'clsx';
import { useMainStore } from '@/shared/zust-store';


export const WindowButtons = React.memo((props: any) => {
    return (
        <div className="window-buttons flex  [&>div]:hover:bg-[#e7e5e4] dark:[&>div]:hover:bg-[#1c1917]">
            <div className="p-2 flex justify-center align-center"
                onClick={() => window.electron.minimizeApp()}>
                <Minus className="w-[20px] h-[20px] text-black dark:text-[#e7e5e4]" />
            </div>
            <div className="p-2 flex justify-center align-center"
                onClick={() => window.electron.maximizeApp()}>
                <Maximize className="w-[20px] h-[20px] text-black dark:text-[#e7e5e4]" />
            </div>
            <div className="p-2 flex justify-center align-center"
                onClick={() => window.electron.closeApp()}>
                <X className="w-[20px] h-[20px] text-black dark:text-[#e7e5e4]" />
            </div>
        </div>
    )
})

export const NotesItem = React.memo((props: {note: INoteData; onClick: Function}) => {
    const active_note = useMainStore(state => state.active_note)

    return (
        <div onContextMenu={() => window.electron.open_note_item_context_menu(props.note.id.toString())} className={clsx('w-[100%] p-4 [&.active]:rounded-2xl cursor-pointer', {'active': active_note.id == props.note.id})} onClick={() => props.onClick(props.note)}>
            <div className='font-bold text-md' dangerouslySetInnerHTML={{__html: Object.keys((props.note.note as TNote)).length == 0 ? "New note" : (props.note.note as TNote).blocks[0].data.text}}>
            </div>
            <div className='flex text-xs text-stone-800 dark:text-stone-300'>
                <div>{Object.keys((props.note.note as TNote)).length == 0 ? '' : userFriendlyTime((props.note.note as TNote).time)}</div>
                <div className='flex-1 ml-2 truncate' dangerouslySetInnerHTML={{__html: Object.keys((props.note.note as TNote)).length == 0 ?
                        "New note":
                        (props.note.note as TNote).blocks.length == 1 ?
                        (props.note.note as TNote).blocks[0].data.text:
                        (props.note.note as TNote).blocks[1].data.text}}>
                </div>
            </div>
        </div>
    )
})

export const NotesList = React.memo((props: any) => {
    return (
        <div className='w-[100%] p-3 [&_.active]:bg-stone-200 dark:[&_.active]:bg-sky-900'>
            <div className='text-md capitalize'>{props.section}</div>
            <div className='divide-y-1 divide-y-stone-700 dark:divide-y-stone-400'>
                {
                    props.data.map((note: INoteData) => 
                        <NotesItem key={Math.floor(Math.random() * 99999999999)} note={note} onClick={props.onClick} />)
                }
            </div>
        </div>
    )
})