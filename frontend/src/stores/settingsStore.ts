import { create } from 'zustand'

interface SettingsState {
  openalgo_host: string
  openalgo_ws_url: string
  is_configured: boolean
  has_api_key: boolean
  isLoading: boolean

  setSettings: (settings: {
    openalgo_host: string
    openalgo_ws_url: string
    is_configured: boolean
    has_api_key: boolean
  }) => void
  setLoading: (loading: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  openalgo_host: 'http://127.0.0.1:5000',
  openalgo_ws_url: 'ws://127.0.0.1:8765',
  is_configured: false,
  has_api_key: false,
  isLoading: true,

  setSettings: (settings) => set({
    ...settings,
    isLoading: false,
  }),

  setLoading: (loading) => set({ isLoading: loading }),
}))
