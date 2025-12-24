import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, CheckCircle2, XCircle, Shield, Server, Radio } from 'lucide-react'
import { settingsApi } from '@/lib/api'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export function Settings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const setSettings = useSettingsStore((state) => state.setSettings)

  const [apiKey, setApiKey] = useState('')
  const [host, setHost] = useState('http://127.0.0.1:5000')
  const [wsUrl, setWsUrl] = useState('ws://127.0.0.1:8765')
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { isLoading, data } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  })

  useEffect(() => {
    if (data) {
      setHost(data.openalgo_host)
      setWsUrl(data.openalgo_ws_url)
      setSettings(data)
    }
  }, [data, setSettings])

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({
        title: 'Settings saved',
        description: 'Your OpenAlgo settings have been updated.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const testMutation = useMutation({
    mutationFn: settingsApi.test,
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus('success')
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to OpenAlgo.',
          variant: 'success',
        })
      } else {
        setConnectionStatus('error')
        toast({
          title: 'Connection failed',
          description: data.message,
          variant: 'destructive',
        })
      }
    },
    onError: (error: Error) => {
      setConnectionStatus('error')
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      openalgo_api_key: apiKey || undefined,
      openalgo_host: host,
      openalgo_ws_url: wsUrl,
    })
  }

  const handleTest = () => {
    setConnectionStatus('idle')
    testMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your OpenAlgo connection settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>API Key</CardTitle>
                <CardDescription>
                  Your OpenAlgo API key for authentication
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your OpenAlgo API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to keep existing key. Get your API key from OpenAlgo dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-node-action/10">
                <Server className="h-5 w-5 text-node-action" />
              </div>
              <div>
                <CardTitle>REST API Host</CardTitle>
                <CardDescription>
                  OpenAlgo server URL for REST API calls
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="host">Host URL</Label>
              <Input
                id="host"
                type="url"
                placeholder="http://127.0.0.1:5000"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-node-condition/10">
                <Radio className="h-5 w-5 text-node-condition" />
              </div>
              <div>
                <CardTitle>WebSocket URL</CardTitle>
                <CardDescription>
                  OpenAlgo WebSocket URL for real-time data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="wsUrl">WebSocket URL</Label>
              <Input
                id="wsUrl"
                type="url"
                placeholder="ws://127.0.0.1:8765"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            {connectionStatus === 'success' && (
              <CheckCircle2 className="h-5 w-5 text-buy" />
            )}
            {connectionStatus === 'error' && (
              <XCircle className="h-5 w-5 text-sell" />
            )}
            {connectionStatus === 'idle' && (
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span className="text-sm text-muted-foreground">
              {connectionStatus === 'success' && 'Connection verified'}
              {connectionStatus === 'error' && 'Connection failed'}
              {connectionStatus === 'idle' && 'Test your connection'}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Test Connection
          </Button>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-glow"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
