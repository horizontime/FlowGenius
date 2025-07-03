import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { INoteEntry, INote } from "@/shared/types";
import { useMainStore } from "@/shared/zust-store";
import { generateTagsForNote } from "@/services/ai-tag-generator";
import { hasOpenAIApiKey } from "@/shared/functions";

export default React.memo((props: { entry: INoteEntry }) => {
    const [content, setContent] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    const active_note = useMainStore(state => state.active_note);
    const set_state = useMainStore(state => state.set_state);

    React.useEffect(() => {
        if (props.entry) {
            setContent(props.entry.body || '');
        }
    }, [props.entry, props.entry?.body, props.entry?.updated_at]);

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const tagGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const generate_tags = React.useCallback(async (noteId: number) => {
        if (!hasOpenAIApiKey()) return;
        
        try {
            // Get the most up-to-date note with all entries from the database
            const freshNote = await window.electron.get_note_with_entries(noteId);
            if (freshNote) {
                // Check if note has substantial content (>50 characters total)
                const totalContentLength = freshNote.entries?.reduce((total: number, entry: INoteEntry) => {
                    return total + (entry.body?.length || 0);
                }, 0) || 0;
                
                if (totalContentLength > 50) {
                    console.log("Generating tags for note:", freshNote.title, "with", totalContentLength, "characters");
                    const tags = await generateTagsForNote(freshNote);
                    console.log("Generated tags:", tags);
                    // Always update tags (even if empty) to ensure UI consistency
                    await window.electron.update_note_tags(noteId, tags);
                } else {
                    console.log("Skipping tag generation for note:", freshNote.title, "- insufficient content (", totalContentLength, "characters)");
                    // Clear tags if content is too short
                    await window.electron.update_note_tags(noteId, []);
                }
            }
        } catch (error) {
            console.error("Error generating tags:", error);
        }
    }, []);

    const save_content = React.useCallback(async (value: string) => {
        if (!props.entry || isSaving) return;

        // Prepare the updated entry object
        const updatedEntry: INoteEntry = { ...props.entry, body: value, updated_at: Date.now() };

        // Optimistically update selected entry and active note so the preview panel reflects changes immediately
        set_state('selected_entry', updatedEntry);

        if (active_note) {
            const updatedActiveNote: INote = {
                ...active_note,
                entries: active_note.entries?.map(e => (e.id === updatedEntry.id ? updatedEntry : e))
            } as INote;
            set_state('active_note', updatedActiveNote);
        }

        setIsSaving(true);
        try {
            // Persist changes to the database – the preload helper will handle background state refresh
            await window.electron.update_note_entry(updatedEntry);
            
            // Debounce tag generation to avoid excessive API calls
            if (active_note) {
                if (tagGenerationTimeoutRef.current) {
                    clearTimeout(tagGenerationTimeoutRef.current);
                }
                
                tagGenerationTimeoutRef.current = setTimeout(() => {
                    generate_tags(active_note.id);
                }, 2000); // Wait 2 seconds after last save before generating tags
            }
        } catch (e) {
            console.error("Error saving entry:", e);
        } finally {
            setIsSaving(false);
        }
    }, [props.entry, isSaving, active_note, set_state, generate_tags]);

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
            if (tagGenerationTimeoutRef.current) {
                clearTimeout(tagGenerationTimeoutRef.current);
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