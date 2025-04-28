export interface IMainState extends IMainStateObject {
  set_state: (title: keyof IMainStateObject, value: any) => void;
}

export interface IMainStateObject {
    active_note: INoteData;
    notes: INoteData[];
}

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