import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { IMainState, INote, INoteEntry } from './types'
// import type {} from '@redux-devtools/extension' // required for devtools typing


export const useMainStore = create<IMainState>()(
    persist(
      (set) => ({
        active_note: null as INote | null,
        notes: [] as INote[],
        selected_entry: null as INoteEntry | null,
        set_state: (title, value) => {
            switch (title) {
                case 'active_note':
                        set((state) => ({ active_note: value }))
                    break;
                
                case 'notes':
                    set((state) => ({ notes: value }))
                    break;

                case 'selected_entry':
                    set((state) => ({ selected_entry: value }))
                    break;

                default:
                    break;
            }
        },
      }),
      {
        name: 'app-main-state',
      },
    ),
)