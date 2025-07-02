import React from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { WindowButtons } from '@/assets/SharedComponents';
import { useMainStore } from '@/shared/zust-store';
import { INote, INoteEntry } from '@/shared/types';
import { hasOpenAIApiKey } from '@/shared/functions';
import { Plus, Search, FileText, Calendar, GripVertical, Trash2, Check, X, Sparkles, Key } from 'lucide-react';
import Editor from './Editor';
import EmptyNoteUI from './EmptyNoteUI';
import ApiKeyModal from '../components/ApiKeyModal';

// Drag and drop imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {
    CSS,
} from '@dnd-kit/utilities';

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
}

// Sortable Entry Component
const SortableEntry = React.memo(({ 
    entry, 
    isSelected, 
    isEditing, 
    editingHeading, 
    processingAI, 
    onSelect, 
    onEdit, 
    onSave, 
    onCancel, 
    onDelete, 
    onAIEnhance, 
    onHeadingChange 
}: {
    entry: INoteEntry;
    isSelected: boolean;
    isEditing: boolean;
    editingHeading: string;
    processingAI: number | null;
    onSelect: () => void;
    onEdit: () => void;
    onSave: (e: React.FormEvent) => void;
    onCancel: () => void;
    onDelete: () => void;
    onAIEnhance: () => void;
    onHeadingChange: (value: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: entry.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
            } ${isDragging ? 'shadow-lg' : ''}`}
            onClick={() => !isEditing && onSelect()}
        >
            <div className="flex items-start gap-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        {isEditing ? (
                            <form onSubmit={onSave} className="flex-1 mr-3">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editingHeading}
                                        onChange={(e) => onHeadingChange(e.target.value)}
                                        className="h-8 min-w-[100px] flex-1"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                onCancel();
                                            }
                                        }}
                                    />
                                    <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={onCancel}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <h3 
                                className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                {entry.heading || 'Untitled'}
                            </h3>
                        )}
                        {!isEditing && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-muted-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAIEnhance();
                                    }}
                                    disabled={processingAI === entry.id}
                                    title="Enhance with AI"
                                >
                                    {processingAI === entry.id ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    ) : (
                                        <Sparkles className="h-3 w-3" />
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {entry.body ? (entry.body.length > 100 ? entry.body.substring(0, 100) + '...' : entry.body) : 'Empty'}
                    </p>
                </div>
            </div>
        </div>
    );
});

export default React.memo((props: any) => {
    const active_note = useMainStore(state => state.active_note);
    const notes = useMainStore(state => state.notes || []);
    const selected_entry = useMainStore(state => state.selected_entry);
    const set_state = useMainStore(state => state.set_state);
    
    const [searchQuery, setSearchQuery] = React.useState('');
    const [editingNoteId, setEditingNoteId] = React.useState<number | null>(null);
    const [editingEntryId, setEditingEntryId] = React.useState<number | null>(null);
    const [editingMiddlePanelTitle, setEditingMiddlePanelTitle] = React.useState<boolean>(false);
    const [editingTitle, setEditingTitle] = React.useState('');
    const [editingHeading, setEditingHeading] = React.useState('');
    const [processingAI, setProcessingAI] = React.useState<number | null>(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = React.useState(false);
    const [hasApiKey, setHasApiKey] = React.useState(false);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const filteredNotes = React.useMemo(() => {
        if (!Array.isArray(notes)) {
            console.warn('Notes is not an array:', notes);
            return [];
        }
        
        // If no search query, return already sorted notes (they come pre-sorted from database)
        if (!searchQuery.trim()) {
            return notes;
        }
        
        const searchLower = searchQuery.toLowerCase();
        return notes.filter(note => {
            // Search in note title
            if (note.title.toLowerCase().includes(searchLower)) return true;
            // Search in note entries
            return note.entries?.some(entry => 
                entry.heading.toLowerCase().includes(searchLower) ||
                entry.body?.toLowerCase().includes(searchLower)
            ) ?? false;
        });
    }, [notes, searchQuery]);

    const handle_create_new_note = React.useCallback(async () => {
        const newNotes = await window.electron.create_note('New Note');
        const newNote = newNotes[0]; // Get the newly created note
        if (newNote) {
            set_state('active_note', newNote);
            set_state('notes', newNotes);
            // Select the first entry of the new note
            if (newNote.entries && newNote.entries.length > 0) {
                set_state('selected_entry', newNote.entries[0]);
            }
            // Auto-focus on the new note title
            setEditingNoteId(newNote.id);
            setEditingTitle(newNote.title);
        }
    }, [set_state]);

    const handle_set_active_note = React.useCallback((note: INote) => {
        set_state('active_note', note);
        // Auto-select the first entry
        if (note.entries && note.entries.length > 0) {
            set_state('selected_entry', note.entries[0]);
        } else {
            set_state('selected_entry', null);
        }
    }, [set_state]);

    const handle_delete_note = React.useCallback(async () => {
        if (active_note && confirm("Are you sure you want to delete this note?")) {
            const deletedNoteId = active_note.id;
            const updatedNotes = await window.electron.delete_note(deletedNoteId);
            
            if (Array.isArray(updatedNotes)) {
                set_state('notes', updatedNotes);
                
                // Clear the active note and selected entry since the note was deleted
                set_state('active_note', null);
                set_state('selected_entry', null);
                
                // If there are remaining notes, select the first one
                if (updatedNotes.length > 0) {
                    const firstNote = updatedNotes[0];
                    set_state('active_note', firstNote);
                    if (firstNote.entries && firstNote.entries.length > 0) {
                        set_state('selected_entry', firstNote.entries[0]);
                    }
                }
            }
        }
    }, [active_note, set_state]);

    const handle_save_note_title = React.useCallback(async (noteId: number) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const updatedNote = { ...note, title: editingTitle };
            const updatedNotes = await window.electron.update_note(updatedNote);
            if (Array.isArray(updatedNotes)) {
                set_state('notes', updatedNotes);
                
                // Update active note if it's the one being edited
                if (active_note?.id === noteId) {
                    const newActiveNote = updatedNotes.find((n: INote) => n.id === noteId);
                    if (newActiveNote) {
                        set_state('active_note', newActiveNote);
                    }
                }
            }
        }
        setEditingNoteId(null);
        setEditingMiddlePanelTitle(false);
        setEditingTitle('');
    }, [notes, editingTitle, active_note, set_state]);

    const handle_save_entry_heading = React.useCallback(async (entryId: number) => {
        if (selected_entry && selected_entry.id === entryId) {
            const updatedEntry = { ...selected_entry, heading: editingHeading };
            const updatedNote = await window.electron.update_note_entry(updatedEntry);
            
            if (updatedNote && active_note) {
                // Optimistically update the local state first for immediate UI feedback
                const updatedSelectedEntry = { ...selected_entry, heading: editingHeading };
                set_state('selected_entry', updatedSelectedEntry);
                
                // Update the active note's entries
                const updatedActiveNote = {
                    ...active_note,
                    entries: active_note.entries?.map(e => 
                        e.id === entryId ? updatedSelectedEntry : e
                    )
                };
                set_state('active_note', updatedActiveNote);
                
                // Fetch full notes list in background (debounced)
                setTimeout(() => {
                    window.electron.fetch_all_notes();
                }, 500);
            }
        }
        setEditingEntryId(null);
        setEditingHeading('');
    }, [selected_entry, editingHeading, active_note, set_state]);

    const handle_add_new_entry = React.useCallback(async () => {
        if (active_note) {
            const newNote = await window.electron.create_note_entry(
                active_note.id, 
                'New Entry', 
                ''
            );
            
            if (newNote) {
                // Update the notes list
                const updatedNotes = await window.electron.fetch_all_notes();
                if (Array.isArray(updatedNotes)) {
                    set_state('notes', updatedNotes);
                    
                    // Update active note
                    const newActiveNote = updatedNotes.find((n: INote) => n.id === active_note.id);
                    if (newActiveNote) {
                        set_state('active_note', newActiveNote);
                        // Select and edit the new entry
                        const newEntry = newActiveNote.entries?.[newActiveNote.entries.length - 1];
                        if (newEntry) {
                            set_state('selected_entry', newEntry);
                            setEditingEntryId(newEntry.id);
                            setEditingHeading('New Entry');
                        }
                    }
                }
            }
        }
    }, [active_note, set_state]);

    const handle_delete_entry = React.useCallback(async (entryId: number) => {
        if (active_note && confirm("Are you sure you want to delete this entry?")) {
            const updatedNote = await window.electron.delete_note_entry(entryId, active_note.id);
            
            if (updatedNote) {
                // Update the notes list
                const updatedNotes = await window.electron.fetch_all_notes();
                if (Array.isArray(updatedNotes)) {
                    set_state('notes', updatedNotes);
                    
                    // Update active note
                    const newActiveNote = updatedNotes.find((n: INote) => n.id === active_note.id);
                    if (newActiveNote) {
                        set_state('active_note', newActiveNote);
                        // Select first entry if current was deleted
                        if (selected_entry?.id === entryId && newActiveNote.entries && newActiveNote.entries.length > 0) {
                            set_state('selected_entry', newActiveNote.entries[0]);
                        } else if (newActiveNote.entries?.length === 0) {
                            set_state('selected_entry', null);
                        }
                    }
                }
            }
        }
    }, [active_note, selected_entry, set_state]);

    const handleDragEnd = React.useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!active_note || !active_note.entries || !over || active.id === over.id) {
            return;
        }

        const oldIndex = active_note.entries.findIndex((entry) => entry.id === active.id);
        const newIndex = active_note.entries.findIndex((entry) => entry.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newEntries = arrayMove(active_note.entries, oldIndex, newIndex);
            const entryIds = newEntries.map((entry) => entry.id);

            try {
                await window.electron.reorder_note_entries(active_note.id, entryIds);
            } catch (error) {
                console.error("Error reordering entries:", error);
            }
        }
    }, [active_note]);

    const handleAIEnhancement = React.useCallback(async (entry: INoteEntry) => {
        if (!active_note || processingAI === entry.id) return;
        
        // Get the API key from localStorage
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please configure your OpenAI API key first by clicking the key icon in the top right.');
            return;
        }
        
        setProcessingAI(entry.id);
        
        try {
            // Call the AI workflow with note title, entry heading, and API key
            const aiContent = await window.electron.process_note_entry_with_ai(
                active_note.title, 
                entry.heading,
                apiKey
            );
            
            if (aiContent) {
                // Append AI content to the existing body content
                const updatedBody = entry.body ? `${entry.body}\n\n${aiContent}` : aiContent;
                const updatedEntry = { ...entry, body: updatedBody };
                
                // Update the note entry
                const updatedNote = await window.electron.update_note_entry(updatedEntry);
                
                if (updatedNote) {
                    // Update the notes list
                    const updatedNotes = await window.electron.fetch_all_notes();
                    if (Array.isArray(updatedNotes)) {
                        set_state('notes', updatedNotes);
                        
                        // Update active note
                        const newActiveNote = updatedNotes.find((n: INote) => n.id === active_note.id);
                        if (newActiveNote) {
                            set_state('active_note', newActiveNote);
                            
                            // Update selected entry if it's the one we just modified
                            if (selected_entry?.id === entry.id) {
                                const updatedSelectedEntry = newActiveNote.entries?.find((e: INoteEntry) => e.id === entry.id);
                                if (updatedSelectedEntry) {
                                    set_state('selected_entry', updatedSelectedEntry);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Error enhancing note entry with AI:', error);
            alert('Failed to enhance note entry with AI. Please check your OpenAI API key and try again.');
        } finally {
            setProcessingAI(null);
        }
    }, [active_note, selected_entry, set_state, processingAI]);

    React.useLayoutEffect(() => {
        let timeoutId: NodeJS.Timeout;
        
        const handleNotesData = (ev: Event & {detail: INote[]}) => {
            // Debounce rapid notes updates
            if (timeoutId) clearTimeout(timeoutId);
            
            timeoutId = setTimeout(() => {
                // Notes should already be sorted from database, but ensure consistency
                const notesData = ev.detail || [];
                const sortedNotes = notesData.length > 1 ? 
                    notesData.sort((a, b) => b.created_at - a.created_at) : 
                    notesData;
                set_state('notes', sortedNotes);
            }, 100);
        };
        
        window.addEventListener('all-notes-data', handleNotesData);
        
        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            window.removeEventListener('all-notes-data', handleNotesData);
        };
    }, [set_state]);

    // Check API key status
    React.useEffect(() => {
        setHasApiKey(hasOpenAIApiKey());
    }, [isApiKeyModalOpen]);

    React.useEffect(() => {
        // Set dark mode by default
        document.documentElement.classList.add('dark');
        localStorage.setItem('dark_mode', 'dark');
        
        // Fetch initial notes data
        window.electron.fetch_all_notes();
        
        // Check initial API key status
        setHasApiKey(hasOpenAIApiKey());
    }, []);
    
    // Keep active_note and selected_entry in sync with notes data
    React.useEffect(() => {
        // Debounce this effect to prevent excessive updates
        const timeoutId = setTimeout(() => {
            if (active_note && notes.length > 0) {
                const updatedActiveNote = notes.find(n => n.id === active_note.id);
                if (updatedActiveNote) {
                    // Only update if there are actual changes (check by timestamp or content)
                    const hasChanges = 
                        updatedActiveNote.updated_at !== active_note.updated_at ||
                        updatedActiveNote.entries?.length !== active_note.entries?.length;
                    
                    if (hasChanges) {
                        set_state('active_note', updatedActiveNote);
                        
                        // Update selected entry if it exists
                        if (selected_entry) {
                            const updatedEntry = updatedActiveNote.entries?.find((e: INoteEntry) => e.id === selected_entry.id);
                            if (updatedEntry) {
                                // Only update if the entry content has changed
                                if (updatedEntry.body !== selected_entry.body || updatedEntry.heading !== selected_entry.heading || updatedEntry.updated_at !== selected_entry.updated_at) {
                                    set_state('selected_entry', updatedEntry);
                                }
                            } else if (updatedActiveNote.entries && updatedActiveNote.entries.length > 0) {
                                // If selected entry no longer exists, select the first one
                                set_state('selected_entry', updatedActiveNote.entries[0]);
                            } else {
                                set_state('selected_entry', null);
                            }
                        }
                    }
                } else {
                    // Active note no longer exists, clear it
                    set_state('active_note', null);
                    set_state('selected_entry', null);
                }
            }
            
            // If no active note but we have notes, select the first one
            if (!active_note && notes.length > 0) {
                set_state('active_note', notes[0]);
                if (notes[0].entries && notes[0].entries.length > 0) {
                    set_state('selected_entry', notes[0].entries[0]);
                }
            }
        }, 50); // Small delay to debounce rapid updates

        return () => clearTimeout(timeoutId);
    }, [notes, active_note, selected_entry, set_state]);

    return (
        <div className='h-[100vh] w-[100%] bg-background'>
            <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Notes List */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <div className="flex flex-col h-full bg-muted/30">
                        <div className="p-4 border-b h-[60px] flex items-center justify-between app-dragger">
                            <h2 className="font-semibold">Notes</h2>
                            <Button size="sm" variant="ghost" onClick={handle_create_new_note}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="pt-6 pb-4 px-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search notes..."
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {filteredNotes.map((note) => {
                                    const isActive = active_note?.id === note.id;
                                    const isEditing = editingNoteId === note.id;
                                    
                                    return (
                                        <div
                                            key={note.id}
                                            className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                                                isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => !isEditing && handle_set_active_note(note)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    {isEditing ? (
                                                        <form onSubmit={(e) => {
                                                            e.preventDefault();
                                                            handle_save_note_title(note.id);
                                                        }}>
                                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                        e.stopPropagation();
                                                        if (e.key === 'Escape') {
                                                            setEditingNoteId(null);
                                                            setEditingTitle('');
                                                        }
                                                    }}
                                                    className="h-7 text-sm min-w-[180px] flex-1"
                                                    autoFocus
                                                                    onBlur={() => {
                                                                        // Small delay to allow button clicks to register
                                                                        setTimeout(() => {
                                                                            if (editingNoteId === note.id) {
                                                                                setEditingNoteId(null);
                                                                                setEditingTitle('');
                                                                            }
                                                                        }, 200);
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                    }}
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingNoteId(null);
                                                                        setEditingTitle('');
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div 
                                                            className="font-medium truncate"
                                                            onDoubleClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingNoteId(note.id);
                                                                setEditingTitle(note.title);
                                                            }}
                                                        >
                                                            {note.title}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(note.updated_at)}
                                                        </span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {note.entries?.length || 0}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        set_state('active_note', note);
                                                        handle_delete_note();
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Middle Panel - Note Entries */}
                <ResizablePanel defaultSize={28.57} minSize={20} maxSize={40}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b h-[60px] flex items-center app-dragger">
                            <div className="flex items-center justify-between w-full">
                                {editingMiddlePanelTitle && active_note ? (
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handle_save_note_title(active_note.id);
                                        }}
                                        className="flex-1 mr-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={editingTitle}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                    if (e.key === 'Escape') {
                                                        setEditingMiddlePanelTitle(false);
                                                        setEditingTitle('');
                                                    }
                                                }}
                                                className="h-8 min-w-[200px] flex-1"
                                                autoFocus
                                                onBlur={() => {
                                                    // Small delay to allow button clicks to register
                                                    setTimeout(() => {
                                                        setEditingMiddlePanelTitle(false);
                                                        setEditingTitle('');
                                                    }, 200);
                                                }}
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    setEditingMiddlePanelTitle(false);
                                                    setEditingTitle('');
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <h2 
                                        className={`font-semibold ${active_note ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                                        onDoubleClick={() => {
                                            if (active_note) {
                                                setEditingMiddlePanelTitle(true);
                                                setEditingTitle(active_note.title);
                                            }
                                        }}
                                    >
                                        {active_note ? active_note.title : 'Select a note'}
                                    </h2>
                                )}
                                {active_note && !editingMiddlePanelTitle && (
                                    <Button size="sm" variant="ghost" onClick={handle_add_new_entry}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {active_note?.entries && active_note.entries.length > 0 ? (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={active_note.entries.map((entry) => entry.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {active_note.entries.map((entry) => {
                                                const isSelected = selected_entry?.id === entry.id;
                                                const isEditing = editingEntryId === entry.id;
                                                
                                                return (
                                                    <SortableEntry
                                                        key={entry.id}
                                                        entry={entry}
                                                        isSelected={isSelected}
                                                        isEditing={isEditing}
                                                        editingHeading={editingHeading}
                                                        processingAI={processingAI}
                                                        onSelect={() => set_state('selected_entry', entry)}
                                                        onEdit={() => {
                                                            setEditingEntryId(entry.id);
                                                            setEditingHeading(entry.heading);
                                                        }}
                                                        onSave={(e) => {
                                                            e.preventDefault();
                                                            handle_save_entry_heading(entry.id);
                                                        }}
                                                        onCancel={() => {
                                                            setEditingEntryId(null);
                                                            setEditingHeading('');
                                                        }}
                                                        onDelete={() => handle_delete_entry(entry.id)}
                                                        onAIEnhance={() => handleAIEnhancement(entry)}
                                                        onHeadingChange={setEditingHeading}
                                                    />
                                                );
                                            })}
                                        </SortableContext>
                                    </DndContext>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        No entries yet. Click the + button to add one.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Right Panel - Content Editor */}
                <ResizablePanel defaultSize={51.43} minSize={40}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b app-dragger h-[60px]">
                            <h2 className="font-semibold">
                                {selected_entry 
                                    ? selected_entry.heading || 'No heading'
                                    : 'Select an entry'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setIsApiKeyModalOpen(true)}
                                    className={`h-8 w-8 p-0 ${hasApiKey ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'}`}
                                    title={hasApiKey ? "OpenAI API Key Configured" : "Configure OpenAI API Key"}
                                >
                                    <Key className="h-4 w-4" />
                                </Button>
                                <WindowButtons />
                            </div>
                        </div>
                        <div className="flex-1 p-4">
                            {active_note && selected_entry ? (
                                <Editor key={`${selected_entry.id}`} entry={selected_entry} />
                            ) : (
                                <EmptyNoteUI onClick={handle_create_new_note} />
                            )}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
            
            <ApiKeyModal 
                isOpen={isApiKeyModalOpen} 
                onOpenChange={setIsApiKeyModalOpen} 
            />
        </div>
    );
});