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
                    // Ensure notes is always an array
                    set((state) => ({ notes: value || [] }))
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
        version: 2, // Increment version to trigger migration
        migrate: (persistedState: any, version: number) => {
          // Reset state if coming from old version
          if (version === 1 || !version) {
            return {
              active_note: null,
              notes: [],
              selected_entry: null,
              set_state: persistedState.set_state
            };
          }
          
          // Ensure notes is always an array
          if (persistedState && !Array.isArray(persistedState.notes)) {
            persistedState.notes = [];
          }
          
          return persistedState;
        },
      },
    ),
)