import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { INoteEntry } from "@/shared/types";

export default React.memo((props: { entry: INoteEntry }) => {
    const [content, setContent] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (props.entry) {
            setContent(props.entry.body || '');
        }
    }, [props.entry]);

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const save_content = React.useCallback(async (value: string) => {
        if (!props.entry || isSaving) return;
        
        setIsSaving(true);
        try {
            const updatedEntry = { ...props.entry, body: value };
            // Just update the entry - the preload function already triggers a notes refresh
            await window.electron.update_note_entry(updatedEntry);
        } catch (e) {
            console.error("Error saving entry:", e);
        } finally {
            setIsSaving(false);
        }
    }, [props.entry, isSaving]);

    const handle_change = React.useCallback((value: string) => {
        setContent(value);
        
        // Debounced save with optimized delay
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            // Use requestIdleCallback if available for non-blocking saves
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => {
                    save_content(value);
                });
            } else {
                save_content(value);
            }
        }, 750); // Balanced delay
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
            className="w-full h-full min-h-[calc(100vh-92px)] resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
            placeholder="Start writing..."
            autoFocus
        />
    );
});