import EditorJSTemplate from "@/app-components/EditorJSTemplate";
import { INoteData } from "@/shared/types";
import { useMainStore } from "@/shared/zust-store";
import { X } from "lucide-react";
import React from "react";

export default React.memo((props: any) => {
    const [note, set_note] = React.useState<INoteData | undefined>();

    const handle_get_note = React.useCallback(async () => {
        const note_id = (new URLSearchParams(location.href.split('?')[1])).get('note_id')
        console.log("note_id", note_id);
        
        const note = await window.electron.get_note(note_id)
        console.log("note", note);
        set_note(note)        
    }, [])
    
    React.useLayoutEffect(() => {
        handle_get_note()
    }, [])
    
    return (
        <div className="h-[100vh] w-[100%]">
            <div className='h-[40px] w-[100%] border-b-[.5px] border-b-stone-300 dark:border-b-stone-800 app-dragger flex justify-end'>
                <div className="p-2 flex justify-center align-center"
                    onClick={() => window.close()}>
                    <X className="w-[20px] h-[20px] text-black dark:text-[#e7e5e4]" />
                </div>
            </div>
            {
                note == undefined ?
                <div className="h-[100%] w-[100%] flex justify-center items-center">
                    <span>Loading</span>
                </div>:
                <EditorJSTemplate note={note} />  
            }
        </div>
    )
})