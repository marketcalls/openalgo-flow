import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ReactFlowProvider } from '@xyflow/react'
import { settingsApi } from '@/lib/api'
import { useSettingsStore } from '@/stores/settingsStore'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Settings } from '@/pages/Settings'
import { Editor } from '@/pages/Editor'
import { TooltipProvider } from '@/components/ui/tooltip'

function EditorWrapper() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  )
}

export default function App() {
  const setSettings = useSettingsStore((state) => state.setSettings)
  const setLoading = useSettingsStore((state) => state.setLoading)
  const isConfigured = useSettingsStore((state) => state.is_configured)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })

  useEffect(() => {
    if (data) {
      setSettings(data)
    }
    setLoading(isLoading)
  }, [data, isLoading, setSettings, setLoading])

  return (
    <TooltipProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/editor/:id" element={<EditorWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </TooltipProvider>
  )
}
