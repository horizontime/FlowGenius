import { INoteData, TNote } from "./types";

export const userFriendlyTime = (t_stamp: number) => {
    const aWeekTS = 1000 * 60 * 60 * 24 * 7;
    const aDayAgoTS = 1000 * 60 * 60 * 24;
    const aweekAgo = new Date(Date.now() - aWeekTS).getTime();
    const aDayAgo = new Date(Date.now() - aDayAgoTS).getTime();
    const week_day_to_str = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ];
    if (t_stamp > aweekAgo) {
        if (t_stamp < aDayAgo) {
            return week_day_to_str[new Date(t_stamp).getDay()-1];
        }
        return new Date(t_stamp).toTimeString().slice(0,5);
    }
    return new Date(t_stamp).toLocaleDateString();
}

export const sectionize_notes = (notes: INoteData[]) => {
    const parsed_notes = notes.map(note => {note.note = typeof note.note == 'string' ? JSON.parse(note.note as string) : note.note; return note})
    const aDayAgoTS = 1000 * 60 * 60 * 24;
    const twoDayAgoTS = 1000 * 60 * 60 * 48;
    const aDayAgo = new Date(Date.now() - aDayAgoTS).getTime();
    const twoDayAgo = new Date(Date.now() - twoDayAgoTS).getTime();

    const todays_notes = parsed_notes.filter(note => (note.note as TNote).time > aDayAgo || Object.keys((note.note as TNote)).length == 0)
    const yesterdays_notes = parsed_notes.filter(note => (note.note as TNote).time < aDayAgo && (note.note as TNote).time > twoDayAgo)
    const previous_notes = parsed_notes.filter(note => (note.note as TNote).time < twoDayAgo)
    const sections = {} as any

    if (todays_notes.length > 0) {
        sections['today'] = todays_notes
    }

    console.log("sections", sections);
    
    if (yesterdays_notes.length > 0) {
        sections['yesterday'] = yesterdays_notes
    }
    if (previous_notes.length > 0) {
        sections['previous'] = previous_notes
    }

    return sections
}
