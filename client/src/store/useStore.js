import { create } from 'zustand'
import { getAllScenes, getMiniMap } from '../services/api'

const useStore = create((set, get) => ({
  // ─── Scenes ─────────────────────────────
  scenes: [],
  scenesLoading: false,
  scenesError: null,

  fetchScenes: async () => {
    set({ scenesLoading: true, scenesError: null })
    try {
      const res = await getAllScenes()
      set({ scenes: res.data.data, scenesLoading: false })
    } catch (err) {
      set({ scenesError: err.message, scenesLoading: false })
    }
  },

  setScenes: (scenes) => set({ scenes }),

  // ─── Current scene ──────────────────────
  currentSceneId: null,
  setCurrentSceneId: (id) => set({ currentSceneId: id }),

  getCurrentScene: () => {
    const { scenes, currentSceneId } = get()
    return scenes.find((s) => s.id === currentSceneId) || null
  },

  // ─── MiniMap ────────────────────────────
  miniMap: null,
  miniMapLoading: false,
  miniMapError: null,

  fetchMiniMap: async () => {
    set({ miniMapLoading: true, miniMapError: null })
    try {
      const res = await getMiniMap()
      set({ miniMap: res.data.data, miniMapLoading: false })
    } catch (err) {
      set({ miniMapError: err.message, miniMapLoading: false })
    }
  },

  setMiniMap: (miniMap) => set({ miniMap }),

  // ─── UI State ───────────────────────────
  showMiniMap: true,
  toggleMiniMap: () => set((s) => ({ showMiniMap: !s.showMiniMap })),

  language: localStorage.getItem('sv-lang') || 'en',
  setLanguage: (lang) => {
    localStorage.setItem('sv-lang', lang)
    set({ language: lang })
  },
}))

export default useStore
