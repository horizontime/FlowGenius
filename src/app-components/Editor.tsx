import React from "react";
import EditorJSTemplate from "./EditorJSTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMainStore } from "@/shared/zust-store";

export default React.memo((props: any) => {
    const active_note = useMainStore(state => state.active_note)

    const handle_change = React.useCallback((api: any, event: any) => {
        console.log("api", api);
        api.saver.save().then((data: any) => {
            console.log("datadata", data);    
            window.electron.set_note({
                id: props.note != undefined ? props.note.id : active_note.id,
                note: JSON.stringify(data)
            }, true)
        })        
    }, [props.note || active_note])

    return (
        <ScrollArea className="h-[calc(100%-40px)]">
            <EditorJSTemplate note={props.note} onChange={handle_change} />
        </ScrollArea>
    )
})