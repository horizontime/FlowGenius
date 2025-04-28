import React from "react";
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
// @ts-ignore
import Link from '@editorjs/link';
// @ts-ignore
import CheckList from '@editorjs/checklist';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
// @ts-ignore
import Marker from '@editorjs/marker';
import { useMainStore } from "@/shared/zust-store";
import { TNote } from "@/shared/types";



export default React.memo((props: any) => {
    const active_note = useMainStore(state => state.active_note)
    const editor_ref = React.useRef<EditorJS | undefined>(undefined)

    React.useEffect(() => {
        const real_note = props.note?.note || active_note.note
        const note = typeof real_note == 'string' ? JSON.parse(real_note as string) : real_note
        console.log("Active note", active_note, typeof real_note, note);

        if (editor_ref.current != undefined) editor_ref.current.destroy()
        
        editor_ref.current = new EditorJS({
            holder: 'editorjs-container',
            tools: {
                header: Header,
                link: Link,
                checklist: CheckList,
                list: List,
                quote: Quote,
                marker: Marker,
            },
            onChange(api, event) {
                props.onChange(api, event)
            },
            data: Object.keys(note).length == 0 ? {} : note,
            
        });

    }, [props.note?.id || active_note.id])
    
    return (
        <div id="editorjs-container" className="dark:[&_::selection]:bg-[oklch(37.4%_0.01_67.558)_!important] dark:[&_::selection]:text-white dark:[&_svg_path,_svg_line,_svg_rect]:stroke-[#ddd_!important] p-4 dark:text-white h-[100%] dark:[&_.ce-popover-item]:text-[white_!important] dark:[&__[class*=container]_::-webkit-scrollbar]:hidden dark:[&_.cdx-search-field]:bg-[oklch(37.4%_0.01_67.558)_!important] dark:[&_.ce-popover-item]:hover:bg-[oklch(37.4%_0.01_67.558)_!important] dark:[&_[class*=container]]:bg-[oklch(21.6%_0.006_56.043)_!important] dark:[&_[class*=container]]:border-[transparent_!important] dark:[&_[class*=plus]]:hover:bg-[oklch(37.4%_0.01_67.558)_!important]"></div>
    )
})