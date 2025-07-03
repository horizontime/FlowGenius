export interface IMainState extends IMainStateObject {
  set_state: (title: keyof IMainStateObject, value: any) => void;
}

export interface IMainStateObject {
    active_note: INote | null;
    notes: INote[];
    selected_entry: INoteEntry | null;
}

export interface INote {
    id: number;
    title: string;
    summary?: string;
    study_plan?: string;
    tags?: string[];
    created_at: number;
    updated_at: number;
    entries?: INoteEntry[];
    /**
     * Optional rich-text content (EditorJS format) kept for backward-compatibility.
     * New code should migrate to using `entries`, but older components such as
     * `EditorJSTemplate` still read from this field, so we leave it as optional.
     */
    note?: string | TNote;
}

export interface INoteEntry {
    id: number;
    note_id: number;
    heading: string;
    body: string;
    order_index: number;
    created_at: number;
    updated_at: number;
}

// Legacy interfaces for migration purposes
export interface INoteData {
    id: number | null,
    note: string | TNote;
}

export type TNote = {
    time: number,
    blocks: TNoteBlock[],
    version: string
}

export type TNoteBlock = {
    id: string,
    type: string,
    data: {
        text: string
    }
}