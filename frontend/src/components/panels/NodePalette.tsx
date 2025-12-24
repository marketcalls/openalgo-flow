import {
  Clock,
  ShoppingCart,
  Zap,
  TrendingUp,
  XCircle,
  Square,
  Briefcase,
  Wallet,
  Send,
  Bell,
  Timer,
  Layers,
  Package,
  Split,
  Pencil,
  FileSearch,
  BarChart3,
  Layers3,
  Calendar,
  Variable,
  FileText,
  Group,
} from 'lucide-react'
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
        'group cursor-grab rounded-lg border border-border bg-card p-2.5 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-md active:cursor-grabbing'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            color
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">{label}</div>
          <div className="truncate text-[10px] text-muted-foreground">{description}</div>
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
      icon: <Clock className="h-3.5 w-3.5 text-node-trigger" />,
      color: 'bg-node-trigger/10',
    },
    {
      type: 'priceAlert',
      label: 'Price Alert',
      description: 'Trigger on price',
      icon: <Bell className="h-3.5 w-3.5 text-node-trigger" />,
      color: 'bg-node-trigger/10',
    },
  ]

  const actions = [
    {
      type: 'placeOrder',
      label: 'Place Order',
      description: 'Basic order',
      icon: <ShoppingCart className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'smartOrder',
      label: 'Smart Order',
      description: 'Position-aware',
      icon: <Zap className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'optionsOrder',
      label: 'Options Order',
      description: 'ATM/ITM/OTM',
      icon: <TrendingUp className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'optionsMultiOrder',
      label: 'Multi-Leg',
      description: 'Options strategies',
      icon: <Layers className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'basketOrder',
      label: 'Basket Order',
      description: 'Multiple orders',
      icon: <Package className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'splitOrder',
      label: 'Split Order',
      description: 'Large order split',
      icon: <Split className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'modifyOrder',
      label: 'Modify Order',
      description: 'Edit order',
      icon: <Pencil className="h-3.5 w-3.5 text-node-action" />,
      color: 'bg-node-action/10',
    },
    {
      type: 'cancelOrder',
      label: 'Cancel Order',
      description: 'Cancel by ID',
      icon: <XCircle className="h-3.5 w-3.5 text-sell" />,
      color: 'bg-sell/10',
    },
    {
      type: 'cancelAllOrders',
      label: 'Cancel All',
      description: 'Cancel orders',
      icon: <XCircle className="h-3.5 w-3.5 text-sell" />,
      color: 'bg-sell/10',
    },
    {
      type: 'closePositions',
      label: 'Close Positions',
      description: 'Square off all',
      icon: <Square className="h-3.5 w-3.5 text-sell" />,
      color: 'bg-sell/10',
    },
  ]

  const conditions = [
    {
      type: 'positionCheck',
      label: 'Position Check',
      description: 'Check position',
      icon: <Briefcase className="h-3.5 w-3.5 text-node-condition" />,
      color: 'bg-node-condition/10',
    },
    {
      type: 'fundCheck',
      label: 'Fund Check',
      description: 'Check funds',
      icon: <Wallet className="h-3.5 w-3.5 text-node-condition" />,
      color: 'bg-node-condition/10',
    },
    {
      type: 'priceCondition',
      label: 'Price Check',
      description: 'Check price',
      icon: <TrendingUp className="h-3.5 w-3.5 text-node-condition" />,
      color: 'bg-node-condition/10',
    },
    {
      type: 'timeWindow',
      label: 'Time Window',
      description: 'Market hours',
      icon: <Clock className="h-3.5 w-3.5 text-node-condition" />,
      color: 'bg-node-condition/10',
    },
  ]

  const data = [
    {
      type: 'getQuote',
      label: 'Get Quote',
      description: 'Real-time quote',
      icon: <BarChart3 className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      type: 'getDepth',
      label: 'Get Depth',
      description: 'Bid/ask depth',
      icon: <Layers3 className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      type: 'getOrderStatus',
      label: 'Order Status',
      description: 'Check order',
      icon: <FileSearch className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      type: 'history',
      label: 'History',
      description: 'OHLCV data',
      icon: <TrendingUp className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      type: 'openPosition',
      label: 'Open Position',
      description: 'Get position',
      icon: <Briefcase className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      type: 'expiry',
      label: 'Expiry Dates',
      description: 'F&O expiry',
      icon: <Calendar className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
    {
      type: 'multiQuotes',
      label: 'Multi Quotes',
      description: 'Multiple symbols',
      icon: <BarChart3 className="h-3.5 w-3.5 text-primary" />,
      color: 'bg-primary/10',
    },
  ]

  const utilities = [
    {
      type: 'variable',
      label: 'Variable',
      description: 'Store values',
      icon: <Variable className="h-3.5 w-3.5 text-purple-400" />,
      color: 'bg-purple-400/10',
    },
    {
      type: 'log',
      label: 'Log',
      description: 'Debug message',
      icon: <FileText className="h-3.5 w-3.5 text-blue-400" />,
      color: 'bg-blue-400/10',
    },
    {
      type: 'telegramAlert',
      label: 'Telegram',
      description: 'Send alert',
      icon: <Send className="h-3.5 w-3.5 text-[#0088cc]" />,
      color: 'bg-[#0088cc]/10',
    },
    {
      type: 'delay',
      label: 'Delay',
      description: 'Wait duration',
      icon: <Timer className="h-3.5 w-3.5 text-muted-foreground" />,
      color: 'bg-muted',
    },
    {
      type: 'group',
      label: 'Group',
      description: 'Group nodes',
      icon: <Group className="h-3.5 w-3.5 text-muted-foreground" />,
      color: 'bg-muted',
    },
  ]

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold">Nodes</h2>
        <p className="text-[10px] text-muted-foreground">
          Drag nodes to the canvas
        </p>
      </div>
      <Tabs defaultValue="triggers" className="flex-1">
        <div className="border-b border-border px-1 py-1.5">
          <TabsList className="h-7 w-full">
            <TabsTrigger value="triggers" className="flex-1 text-[9px] px-0.5">
              Triggers
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex-1 text-[9px] px-0.5">
              Actions
            </TabsTrigger>
            <TabsTrigger value="data" className="flex-1 text-[9px] px-0.5">
              Data
            </TabsTrigger>
            <TabsTrigger value="conditions" className="flex-1 text-[9px] px-0.5">
              Logic
            </TabsTrigger>
            <TabsTrigger value="utilities" className="flex-1 text-[9px] px-0.5">
              Util
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <TabsContent value="triggers" className="m-0 p-2">
            <div className="space-y-1.5">
              {triggers.map((node) => (
                <NodeItem
                  key={node.type}
                  {...node}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="actions" className="m-0 p-2">
            <div className="space-y-1.5">
              {actions.map((node) => (
                <NodeItem
                  key={node.type}
                  {...node}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="data" className="m-0 p-2">
            <div className="space-y-1.5">
              {data.map((node) => (
                <NodeItem
                  key={node.type}
                  {...node}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="conditions" className="m-0 p-2">
            <div className="space-y-1.5">
              {conditions.map((node) => (
                <NodeItem
                  key={node.type}
                  {...node}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="utilities" className="m-0 p-2">
            <div className="space-y-1.5">
              {utilities.map((node) => (
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
