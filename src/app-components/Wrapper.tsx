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
import { INoteData, TNote, TNoteBlock } from '@/shared/types';
import { Plus, Search, FileText, Calendar, GripVertical, Trash2 } from 'lucide-react';
import Editor from './Editor';
import EmptyNoteUI from './EmptyNoteUI';

const sort_notes = (a: INoteData, b: INoteData) => {
    const noteA = JSON.parse(a.note as string) as TNote;
    const noteB = JSON.parse(b.note as string) as TNote;
    return (noteB.time || 0) - (noteA.time || 0);
}

const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
}

const getPreviewText = (blocks: TNoteBlock[]) => {
    if (!blocks || blocks.length === 0) return 'No content';
    return blocks[0]?.data?.text || 'No content';
}

export default React.memo((props: any) => {
    const active_note = useMainStore(state => state.active_note);
    const notes = useMainStore(state => state.notes);
    const set_state = useMainStore(state => state.set_state);
    const [selectedBlock, setSelectedBlock] = React.useState<number>(0);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredNotes = React.useMemo(() => {
        return notes.filter(note => {
            const noteData = JSON.parse(note.note as string) as TNote;
            const searchLower = searchQuery.toLowerCase();
            return noteData.blocks?.some(block => 
                block.data?.text?.toLowerCase().includes(searchLower)
            ) ?? false;
        }).sort(sort_notes);
    }, [notes, searchQuery]);

    const currentNoteData = React.useMemo(() => {
        if (!active_note) return null;
        try {
            return JSON.parse(active_note.note as string) as TNote;
        } catch {
            return { blocks: [], time: Date.now(), version: '' } as TNote;
        }
    }, [active_note]);

    const handle_create_new_note = React.useCallback(async () => {
        const newNote: TNote = {
            time: Date.now(),
            blocks: [{
                id: Date.now().toString(),
                type: 'paragraph',
                data: { text: 'New Note' }
            }],
            version: '2.27.0'
        };

        const dummy_data = {
            id: null,
            note: JSON.stringify(newNote)
        } as INoteData;

        const notes = await window.electron.set_note(dummy_data);
        const sorted_note = notes.sort(sort_notes);
        set_state('active_note', sorted_note[0]);
        set_state('notes', sorted_note);
    }, []);

    const handle_set_active_note = React.useCallback((note: INoteData) => {
        set_state('active_note', note);
        setSelectedBlock(0);
    }, []);

    const handle_delete_note = React.useCallback(() => {
        if (active_note && confirm("Are you sure you want to delete this note?")) {
            window.electron.delete_note(active_note.id.toString());
        }
    }, [active_note]);

    React.useLayoutEffect(() => {
        window.addEventListener('all-notes-data', (ev: Event & {detail: INoteData[]}) => {
            const sorted_note = ev.detail.sort(sort_notes);
            ev.detail.length == 0 ? set_state('active_note', null) : set_state('active_note', sorted_note[0]);
            set_state('notes', sorted_note);
        });
    }, []);

    React.useEffect(() => {
        // Set dark mode by default
        document.documentElement.classList.add('dark');
        localStorage.setItem('dark_mode', 'dark');
    }, []);

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
                                    const noteData = JSON.parse(note.note as string) as TNote;
                                    const isActive = active_note?.id === note.id;
                                    
                                    return (
                                        <div
                                            key={note.id}
                                            className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                                                isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => handle_set_active_note(note)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">
                                                        {getPreviewText(noteData.blocks)}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(noteData.time)}
                                                        </span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {noteData.blocks?.length || 0}
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

                {/* Middle Panel - Note Items */}
                <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <h2 className="font-semibold">
                                {currentNoteData ? getPreviewText(currentNoteData.blocks) : 'Select a note'}
                            </h2>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2">
                                {currentNoteData?.blocks?.map((block, index) => (
                                    <div
                                        key={block.id}
                                        className={`group p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                                            selectedBlock === index ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => setSelectedBlock(index)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium">
                                                    {block.type === 'header' ? 'Heading' : 'Paragraph'} {index + 1}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {block.data?.text || 'No content'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                {currentNoteData?.blocks?.[selectedBlock] 
                                    ? `${currentNoteData.blocks[selectedBlock].type === 'header' ? 'Heading' : 'Paragraph'} ${selectedBlock + 1}` 
                                    : 'Select an item'}
                            </h2>
                            <WindowButtons />
                        </div>
                        <div className="flex-1 p-4">
                            {active_note ? (
                                <Editor />
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