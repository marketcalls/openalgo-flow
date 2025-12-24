import { useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useWorkflowStore } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  EXCHANGES,
  PRODUCT_TYPES,
  PRICE_TYPES,
  ORDER_ACTIONS,
  SCHEDULE_TYPES,
  DAYS_OF_WEEK,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ConfigPanel() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, selectNode } = useWorkflowStore()

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleDataChange = useCallback(
    (key: string, value: unknown) => {
      if (selectedNodeId) {
        updateNodeData(selectedNodeId, { [key]: value })
      }
    },
    [selectedNodeId, updateNodeData]
  )

  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
    }
  }, [selectedNodeId, deleteNode])

  const handleClose = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col border-l border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Properties</h2>
          <p className="text-xs text-muted-foreground">
            Select a node to configure
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">No node selected</p>
        </div>
      </div>
    )
  }

  const nodeData = selectedNode.data as Record<string, unknown>

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="font-semibold">
            {selectedNode.type === 'start' ? 'Schedule' : 'Place Order'}
          </h2>
          <p className="text-xs text-muted-foreground">Configure node</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {selectedNode.type === 'start' && (
            <>
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <Select
                  value={(nodeData.scheduleType as string) || 'daily'}
                  onValueChange={(v) => handleDataChange('scheduleType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={(nodeData.time as string) || '09:15'}
                  onChange={(e) => handleDataChange('time', e.target.value)}
                />
              </div>

              {nodeData.scheduleType === 'weekly' && (
                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map((day) => {
                      const days = (nodeData.days as number[]) || []
                      const isSelected = days.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const newDays = isSelected
                              ? days.filter((d) => d !== day.value)
                              : [...days, day.value].sort()
                            handleDataChange('days', newDays)
                          }}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-accent'
                          )}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {nodeData.scheduleType === 'once' && (
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={(nodeData.executeAt as string) || ''}
                    onChange={(e) => handleDataChange('executeAt', e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {selectedNode.type === 'placeOrder' && (
            <>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g., RELIANCE"
                  value={(nodeData.symbol as string) || ''}
                  onChange={(e) => handleDataChange('symbol', e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <Label>Exchange</Label>
                <Select
                  value={(nodeData.exchange as string) || 'NSE'}
                  onValueChange={(v) => handleDataChange('exchange', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCHANGES.map((ex) => (
                      <SelectItem key={ex.value} value={ex.value}>
                        {ex.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ORDER_ACTIONS.map((action) => (
                    <button
                      key={action.value}
                      type="button"
                      onClick={() => handleDataChange('action', action.value)}
                      className={cn(
                        'rounded-lg border py-2 text-sm font-semibold transition-colors',
                        nodeData.action === action.value
                          ? action.value === 'BUY'
                            ? 'badge-buy'
                            : 'badge-sell'
                          : 'border-border bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={(nodeData.quantity as number) || 1}
                  onChange={(e) => handleDataChange('quantity', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={(nodeData.product as string) || 'MIS'}
                  onValueChange={(v) => handleDataChange('product', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Type</Label>
                <Select
                  value={(nodeData.priceType as string) || 'MARKET'}
                  onValueChange={(v) => handleDataChange('priceType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(nodeData.priceType === 'LIMIT' || nodeData.priceType === 'SL') && (
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    value={(nodeData.price as number) || 0}
                    onChange={(e) => handleDataChange('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              {(nodeData.priceType === 'SL' || nodeData.priceType === 'SL-M') && (
                <div className="space-y-2">
                  <Label>Trigger Price</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    value={(nodeData.triggerPrice as number) || 0}
                    onChange={(e) => handleDataChange('triggerPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Node
        </Button>
      </div>
    </div>
  )
}
