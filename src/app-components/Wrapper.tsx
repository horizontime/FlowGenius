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
import { Plus, Search, FileText, Calendar, GripVertical, Trash2, Check, X, Sparkles } from 'lucide-react';
import Editor from './Editor';
import EmptyNoteUI from './EmptyNoteUI';

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
}

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

    const filteredNotes = React.useMemo(() => {
        if (!Array.isArray(notes)) {
            console.warn('Notes is not an array:', notes);
            return [];
        }
        
        return notes.filter(note => {
            const searchLower = searchQuery.toLowerCase();
            // Search in note title
            if (note.title.toLowerCase().includes(searchLower)) return true;
            // Search in note entries
            return note.entries?.some(entry => 
                entry.heading.toLowerCase().includes(searchLower) ||
                entry.body?.toLowerCase().includes(searchLower)
            ) ?? false;
        }).sort((a, b) => b.updated_at - a.updated_at);
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

    const handle_delete_note = React.useCallback(() => {
        if (active_note && confirm("Are you sure you want to delete this note?")) {
            window.electron.delete_note(active_note.id);
        }
    }, [active_note]);

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
                // Update the notes list
                const updatedNotes = await window.electron.fetch_all_notes();
                if (Array.isArray(updatedNotes)) {
                    set_state('notes', updatedNotes);
                    
                    // Update active note
                    const newActiveNote = updatedNotes.find((n: INote) => n.id === active_note.id);
                    if (newActiveNote) {
                        set_state('active_note', newActiveNote);
                        // Update selected entry
                        const newSelectedEntry = newActiveNote.entries?.find((e: INoteEntry) => e.id === entryId);
                        if (newSelectedEntry) {
                            set_state('selected_entry', newSelectedEntry);
                        }
                    }
                }
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

    React.useLayoutEffect(() => {
        const handleNotesData = (ev: Event & {detail: INote[]}) => {
            const sortedNotes = (ev.detail || []).sort((a, b) => b.updated_at - a.updated_at);
            set_state('notes', sortedNotes);
        };
        
        window.addEventListener('all-notes-data', handleNotesData);
        
        // Cleanup
        return () => {
            window.removeEventListener('all-notes-data', handleNotesData);
        };
    }, [set_state]);

    React.useEffect(() => {
        // Set dark mode by default
        document.documentElement.classList.add('dark');
        localStorage.setItem('dark_mode', 'dark');
        
        // Fetch initial notes data
        window.electron.fetch_all_notes();
    }, []);
    
    // Keep active_note and selected_entry in sync with notes data
    React.useEffect(() => {
        if (active_note && notes.length > 0) {
            const updatedActiveNote = notes.find(n => n.id === active_note.id);
            if (updatedActiveNote && updatedActiveNote !== active_note) {
                set_state('active_note', updatedActiveNote);
                
                // Update selected entry if it exists
                if (selected_entry) {
                    const updatedEntry = updatedActiveNote.entries?.find((e: INoteEntry) => e.id === selected_entry.id);
                    if (updatedEntry) {
                        set_state('selected_entry', updatedEntry);
                    } else if (updatedActiveNote.entries && updatedActiveNote.entries.length > 0) {
                        // If selected entry no longer exists, select the first one
                        set_state('selected_entry', updatedActiveNote.entries[0]);
                    } else {
                        set_state('selected_entry', null);
                    }
                }
            }
        }
        
        // If no active note but we have notes, select the first one
        if (!active_note && notes.length > 0) {
            set_state('active_note', notes[0]);
            if (notes[0].entries && notes[0].entries.length > 0) {
                set_state('selected_entry', notes[0].entries[0]);
            }
        }
    }, [notes]);

    return (
        <div className='h-[100vh] w-[100%] bg-background'>
            <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Notes List */}
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <div className="flex flex-col h-full bg-muted/30">
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-2 mb-3">
                                <h2 className="font-semibold">Notes</h2>
                                <Button size="sm" variant="ghost" onClick={handle_create_new_note}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
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
                                                                    className="h-7 text-sm"
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
                <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
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
                                                className="h-8"
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
                                {active_note?.entries?.map((entry) => {
                                    const isSelected = selected_entry?.id === entry.id;
                                    const isEditing = editingEntryId === entry.id;
                                    
                                    return (
                                        <div
                                            key={entry.id}
                                            className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                                                isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => !isEditing && set_state('selected_entry', entry)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    {isEditing ? (
                                                        <form onSubmit={(e) => {
                                                            e.preventDefault();
                                                            handle_save_entry_heading(entry.id);
                                                        }}>
                                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                <Input
                                                                    value={editingHeading}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingHeading(e.target.value)}
                                                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                                        e.stopPropagation();
                                                                        if (e.key === 'Escape') {
                                                                            setEditingEntryId(null);
                                                                            setEditingHeading('');
                                                                        }
                                                                    }}
                                                                    className="h-8 text-base"
                                                                    autoFocus
                                                                    onBlur={() => {
                                                                        setTimeout(() => {
                                                                            if (editingEntryId === entry.id) {
                                                                                setEditingEntryId(null);
                                                                                setEditingHeading('');
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
                                                                        setEditingEntryId(null);
                                                                        setEditingHeading('');
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <p 
                                                            className="text-base font-medium line-clamp-2"
                                                            onDoubleClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingEntryId(entry.id);
                                                                setEditingHeading(entry.heading);
                                                            }}
                                                        >
                                                            {entry.heading || 'No heading'}
                                                        </p>
                                                    )}
                                                    <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {entry.body ? entry.body.replace(/\n/g, ' ').trim() : 'Empty'}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // TODO: Add AI functionality here
                                                    }}
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handle_delete_entry(entry.id);
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

                {/* Right Panel - Content Editor */}
                <ResizablePanel defaultSize={50} minSize={40}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b app-dragger">
                            <h2 className="font-semibold">
                                {selected_entry 
                                    ? selected_entry.heading || 'No heading'
                                    : 'Select an entry'}
                            </h2>
                            <WindowButtons />
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
        </div>
    );
});