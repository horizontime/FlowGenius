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
    created_at: number;
    updated_at: number;
    entries?: INoteEntry[];
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