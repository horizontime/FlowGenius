import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { useMainStore } from "@/shared/zust-store";
import { TNote } from "@/shared/types";

export default React.memo((props: { selectedBlock?: number, note?: any }) => {
    const active_note = useMainStore(state => state.active_note);
    const set_state = useMainStore(state => state.set_state);
    const [content, setContent] = React.useState('');

    React.useEffect(() => {
        if (active_note && props.selectedBlock !== undefined) {
            try {
                const noteData = JSON.parse(active_note.note as string) as TNote;
                if (noteData.blocks && noteData.blocks[props.selectedBlock]) {
                    setContent(noteData.blocks[props.selectedBlock].data?.text || '');
                    console.log(`Loading block ${props.selectedBlock}:`, noteData.blocks[props.selectedBlock].data?.text);
                }
            } catch (e) {
                console.error("Error parsing note data:", e);
            }
        }
    }, [active_note, props.selectedBlock]);

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const save_content = React.useCallback(async (value: string) => {
        if (!active_note || props.selectedBlock === undefined) return;
        
        console.log(`Saving block ${props.selectedBlock} with content:`, value);
        
        try {
            const noteData = JSON.parse(active_note.note as string) as TNote;
            if (noteData.blocks && noteData.blocks[props.selectedBlock]) {
                // Only update the selected block, not the first block
                noteData.blocks[props.selectedBlock].data.text = value;
                
                console.log(`Updated block ${props.selectedBlock}, blocks:`, noteData.blocks.map(b => b.data.text));
                
                const updatedNote = {
                    id: active_note.id,
                    note: JSON.stringify(noteData)
                };
                
                const updatedNotes = await window.electron.set_note(updatedNote);
                // Update the state with the new notes
                set_state('notes', updatedNotes);
                // Update the active note to reflect the changes
                const newActiveNote = updatedNotes.find((n: any) => n.id === active_note.id);
                if (newActiveNote) {
                    set_state('active_note', newActiveNote);
                }
            }
        } catch (e) {
            console.error("Error saving note:", e);
        }
    }, [props.selectedBlock, active_note, set_state]);

    const handle_change = React.useCallback((value: string) => {
        setContent(value);
        
        // Debounced save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            save_content(value);
        }, 500);
    }, [save_content]);

    React.useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    if (props.selectedBlock === undefined) {
        return <div className="text-muted-foreground">Select a block to edit</div>;
    }

    return (
        <Textarea
            value={content}
            onChange={(e) => handle_change(e.target.value)}
            className="w-full h-full min-h-[calc(100vh-120px)] resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
            placeholder="Start writing..."
            autoFocus
        />
    );
});