import { useCallback, useRef, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Loader2,
  MoreVertical,
} from 'lucide-react'
import { workflowsApi } from '@/lib/api'
import { useWorkflowStore } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { StartNode } from '@/components/nodes/StartNode'
import { PlaceOrderNode } from '@/components/nodes/PlaceOrderNode'
import { NodePalette } from '@/components/panels/NodePalette'
import { ConfigPanel } from '@/components/panels/ConfigPanel'
import { cn } from '@/lib/utils'

const nodeTypes = {
  start: StartNode,
  placeOrder: PlaceOrderNode,
}

let nodeId = 0
const getNodeId = () => `node_${nodeId++}`

export function Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const {
    name,
    nodes,
    edges,
    selectedNodeId,
    isModified,
    setWorkflow,
    setName,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    markSaved,
    resetWorkflow,
  } = useWorkflowStore()

  const [isActive, setIsActive] = useState(false)

  const { isLoading, data: workflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.get(Number(id)),
    enabled: !!id,
  })

  useEffect(() => {
    if (workflow) {
      setWorkflow({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        nodes: workflow.nodes as Node[],
        edges: workflow.edges,
      })
      setIsActive(workflow.is_active)
      // Set node ID counter
      const maxId = Math.max(
        0,
        ...workflow.nodes.map((n) => {
          const match = n.id.match(/node_(\d+)/)
          return match ? parseInt(match[1]) : 0
        })
      )
      nodeId = maxId + 1
    }
  }, [workflow, setWorkflow])

  useEffect(() => {
    return () => {
      resetWorkflow()
    }
  }, [resetWorkflow])

  const saveMutation = useMutation({
    mutationFn: () =>
      workflowsApi.update(Number(id), {
        name,
        nodes,
        edges,
      }),
    onSuccess: () => {
      markSaved()
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast({ title: 'Workflow saved', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => workflowsApi.activate(Number(id)),
    onSuccess: () => {
      setIsActive(true)
      queryClient.invalidateQueries({ queryKey: ['workflow', id] })
      toast({ title: 'Workflow activated', variant: 'success' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: () => workflowsApi.deactivate(Number(id)),
    onSuccess: () => {
      setIsActive(false)
      queryClient.invalidateQueries({ queryKey: ['workflow', id] })
      toast({ title: 'Workflow deactivated' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const executeMutation = useMutation({
    mutationFn: () => workflowsApi.execute(Number(id)),
    onSuccess: (data) => {
      toast({
        title: data.status === 'success' ? 'Execution started' : 'Execution failed',
        description: data.message,
        variant: data.status === 'success' ? 'success' : 'destructive',
      })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowWrapper.current) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: type === 'start'
          ? { scheduleType: 'daily', time: '09:15' }
          : { symbol: '', exchange: 'NSE', action: 'BUY', quantity: 1, priceType: 'MARKET', product: 'MIS' },
      }

      addNode(newNode)
    },
    [screenToFlowPosition, addNode]
  )

  const handleDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const handlePaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-64 flex-shrink-0">
        <NodePalette onDragStart={handleDragStart} />
      </div>

      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-64 border-transparent bg-transparent px-2 font-medium hover:border-border focus:border-border"
            />
            {isModified && (
              <span className="text-xs text-muted-foreground">Unsaved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isModified}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="btn-glow"
              >
                {activateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Activate
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => executeMutation.mutate()}
                  disabled={executeMutation.isPending}
                >
                  Run Now
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
          >
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              pannable
              zoomable
            />
            <Panel position="bottom-center" className="mb-4">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm',
                  isActive && 'border-buy/30 bg-buy/5'
                )}
              >
                <div className={cn('status-dot', isActive ? 'active' : 'inactive')} />
                <span className="text-muted-foreground">
                  {isActive ? 'Workflow active' : 'Workflow inactive'}
                </span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {selectedNodeId && <ConfigPanel />}
    </div>
  )
}
