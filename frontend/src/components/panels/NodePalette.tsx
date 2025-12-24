import { Clock, ShoppingCart } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface NodeItemProps {
  type: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}

function NodeItem({ type, label, description, icon, color, onDragStart }: NodeItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      className={cn(
        'group cursor-grab rounded-lg border border-border bg-card p-3 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-lg active:cursor-grabbing'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            color
          )}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  )
}

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const triggers = [
    {
      type: 'start',
      label: 'Schedule',
      description: 'Start on schedule',
      icon: <Clock className="h-4 w-4 text-node-trigger" />,
      color: 'bg-node-trigger/10',
    },
  ]

  const actions = [
    {
      type: 'placeOrder',
      label: 'Place Order',
      description: 'Place a trading order',
      icon: <ShoppingCart className="h-4 w-4 text-node-action" />,
      color: 'bg-node-action/10',
    },
  ]

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">Nodes</h2>
        <p className="text-xs text-muted-foreground">
          Drag nodes to the canvas
        </p>
      </div>
      <Tabs defaultValue="triggers" className="flex-1">
        <div className="border-b border-border px-4 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="triggers" className="flex-1">
              Triggers
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex-1">
              Actions
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <TabsContent value="triggers" className="m-0 p-4">
            <div className="space-y-2">
              {triggers.map((node) => (
                <NodeItem
                  key={node.type}
                  {...node}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="actions" className="m-0 p-4">
            <div className="space-y-2">
              {actions.map((node) => (
                <NodeItem
                  key={node.type}
                  {...node}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
