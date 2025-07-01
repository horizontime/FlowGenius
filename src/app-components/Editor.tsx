import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { INoteEntry } from "@/shared/types";

export default React.memo((props: { entry: INoteEntry }) => {
    const [content, setContent] = React.useState('');

    React.useEffect(() => {
        if (props.entry) {
            setContent(props.entry.body || '');
        }
    }, [props.entry]);

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const save_content = React.useCallback(async (value: string) => {
        if (!props.entry) return;
        
        try {
            const updatedEntry = { ...props.entry, body: value };
            const updatedNote = await window.electron.update_note_entry(updatedEntry);
            
            if (updatedNote) {
                // Simply trigger a refresh of all notes
                // The sync effect in Wrapper will handle updating active_note and selected_entry
                await window.electron.fetch_all_notes();
            }
        } catch (e) {
            console.error("Error saving entry:", e);
        }
    }, [props.entry]);

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

    if (!props.entry) {
        return <div className="text-muted-foreground">Select an entry to edit</div>;
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