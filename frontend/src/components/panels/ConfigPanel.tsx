import { useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useWorkflowStore } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  EXCHANGES,
  PRODUCT_TYPES,
  PRICE_TYPES,
  ORDER_ACTIONS,
  SCHEDULE_TYPES,
  DAYS_OF_WEEK,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// TradingView-style alert conditions
const ALERT_CONDITIONS = [
  { value: 'crossing', label: 'Crossing' },
  { value: 'crossing_up', label: 'Crossing Up' },
  { value: 'crossing_down', label: 'Crossing Down' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'entering_channel', label: 'Entering Channel' },
  { value: 'exiting_channel', label: 'Exiting Channel' },
  { value: 'inside_channel', label: 'Inside Channel' },
  { value: 'outside_channel', label: 'Outside Channel' },
  { value: 'moving_up', label: 'Moving Up' },
  { value: 'moving_down', label: 'Moving Down' },
  { value: 'moving_up_percent', label: 'Moving Up %' },
  { value: 'moving_down_percent', label: 'Moving Down %' },
]

const ALERT_TRIGGERS = [
  { value: 'once', label: 'Only Once' },
  { value: 'once_per_bar', label: 'Once Per Bar' },
  { value: 'once_per_bar_close', label: 'Once Per Bar Close' },
  { value: 'every_time', label: 'Every Time' },
]

const ALERT_EXPIRATION = [
  { value: 'none', label: 'No Expiration' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: 'custom', label: 'Custom' },
]

// Variable operations
const VARIABLE_OPERATIONS = [
  { value: 'set', label: 'Set Value', description: 'Set variable to a value' },
  { value: 'get', label: 'Get Value', description: 'Copy from another variable' },
  { value: 'add', label: 'Add', description: 'Add to variable' },
  { value: 'subtract', label: 'Subtract', description: 'Subtract from variable' },
  { value: 'multiply', label: 'Multiply', description: 'Multiply variable' },
  { value: 'divide', label: 'Divide', description: 'Divide variable' },
  { value: 'increment', label: 'Increment', description: 'Add 1 to variable' },
  { value: 'decrement', label: 'Decrement', description: 'Subtract 1 from variable' },
  { value: 'parse_json', label: 'Parse JSON', description: 'Parse JSON string to object' },
  { value: 'stringify', label: 'Stringify', description: 'Convert to JSON string' },
  { value: 'append', label: 'Append', description: 'Append to string' },
]

const LOG_LEVELS = [
  { value: 'info', label: 'Info', color: 'text-blue-400' },
  { value: 'warn', label: 'Warning', color: 'text-yellow-400' },
  { value: 'error', label: 'Error', color: 'text-red-400' },
]

// Options Trading Constants
// NSE Index Symbols (F&O Exchange: NFO)
// BSE Index Symbols (F&O Exchange: BFO)
const INDEX_SYMBOLS = [
  // NSE Indices
  { value: 'NIFTY', label: 'NIFTY', exchange: 'NFO', lotSize: 75 },
  { value: 'BANKNIFTY', label: 'BANKNIFTY', exchange: 'NFO', lotSize: 30 },
  { value: 'FINNIFTY', label: 'FINNIFTY', exchange: 'NFO', lotSize: 65 },
  { value: 'MIDCPNIFTY', label: 'MIDCPNIFTY', exchange: 'NFO', lotSize: 120 },
  { value: 'NIFTYNXT50', label: 'NIFTYNXT50', exchange: 'NFO', lotSize: 25 },
  // BSE Indices
  { value: 'SENSEX', label: 'SENSEX', exchange: 'BFO', lotSize: 20 },
  { value: 'BANKEX', label: 'BANKEX', exchange: 'BFO', lotSize: 30 },
  { value: 'SENSEX50', label: 'SENSEX50', exchange: 'BFO', lotSize: 25 },
]

const OPTION_TYPES = [
  { value: 'CE', label: 'Call (CE)' },
  { value: 'PE', label: 'Put (PE)' },
]

const STRIKE_OFFSETS = [
  { value: 'ATM', label: 'ATM' },
  { value: 'ITM1', label: 'ITM 1' },
  { value: 'ITM2', label: 'ITM 2' },
  { value: 'ITM3', label: 'ITM 3' },
  { value: 'ITM4', label: 'ITM 4' },
  { value: 'ITM5', label: 'ITM 5' },
  { value: 'OTM1', label: 'OTM 1' },
  { value: 'OTM2', label: 'OTM 2' },
  { value: 'OTM3', label: 'OTM 3' },
  { value: 'OTM4', label: 'OTM 4' },
  { value: 'OTM5', label: 'OTM 5' },
  { value: 'OTM6', label: 'OTM 6' },
  { value: 'OTM7', label: 'OTM 7' },
  { value: 'OTM8', label: 'OTM 8' },
  { value: 'OTM9', label: 'OTM 9' },
  { value: 'OTM10', label: 'OTM 10' },
]

const EXPIRY_TYPES = [
  { value: 'current_week', label: 'Current Week', description: 'Nearest weekly expiry' },
  { value: 'next_week', label: 'Next Week', description: 'Second weekly expiry' },
  { value: 'current_month', label: 'Current Month', description: 'Last expiry of current month' },
  { value: 'next_month', label: 'Next Month', description: 'Last expiry of next month' },
]

const OPTION_STRATEGIES = [
  { value: 'straddle', label: 'Straddle', description: 'ATM CE + ATM PE' },
  { value: 'strangle', label: 'Strangle', description: 'OTM CE + OTM PE' },
  { value: 'iron_condor', label: 'Iron Condor', description: '4-leg neutral strategy' },
  { value: 'bull_call_spread', label: 'Bull Call Spread', description: 'Buy lower CE, Sell higher CE' },
  { value: 'bear_put_spread', label: 'Bear Put Spread', description: 'Buy higher PE, Sell lower PE' },
  { value: 'custom', label: 'Custom', description: 'Build your own multi-leg' },
]

// Node type to display name mapping
const NODE_TITLES: Record<string, string> = {
  start: 'Schedule Trigger',
  priceAlert: 'Price Alert',
  placeOrder: 'Place Order',
  smartOrder: 'Smart Order',
  optionsOrder: 'Options Order',
  optionsMultiOrder: 'Multi-Leg Options',
  cancelOrder: 'Cancel Order',
  cancelAllOrders: 'Cancel All Orders',
  closePositions: 'Close Positions',
  modifyOrder: 'Modify Order',
  basketOrder: 'Basket Order',
  splitOrder: 'Split Order',
  positionCheck: 'Position Check',
  fundCheck: 'Fund Check',
  timeWindow: 'Time Window',
  priceCondition: 'Price Condition',
  getQuote: 'Get Quote',
  getDepth: 'Market Depth',
  getOrderStatus: 'Order Status',
  history: 'Historical Data',
  openPosition: 'Open Position',
  expiry: 'Expiry Dates',
  intervals: 'Intervals',
  telegramAlert: 'Telegram Alert',
  delay: 'Delay',
  variable: 'Variable',
  log: 'Log',
  group: 'Group',
}

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
  const nodeType = selectedNode.type || 'unknown'
  const nodeTitle = NODE_TITLES[nodeType] || nodeType

  // Check if condition needs channel (two price values)
  const needsChannel = ['entering_channel', 'exiting_channel', 'inside_channel', 'outside_channel'].includes(
    nodeData.condition as string
  )

  // Check if condition is percentage-based
  const isPercentage = ['moving_up_percent', 'moving_down_percent'].includes(nodeData.condition as string)

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="font-semibold">{nodeTitle}</h2>
          <p className="text-xs text-muted-foreground">Configure node</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* ===== PRICE ALERT NODE ===== */}
          {nodeType === 'priceAlert' && (
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
                <Label>Condition</Label>
                <Select
                  value={(nodeData.condition as string) || 'crossing'}
                  onValueChange={(v) => handleDataChange('condition', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsChannel ? (
                <>
                  <div className="space-y-2">
                    <Label>Lower Price</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min={0}
                      placeholder="Lower bound"
                      value={(nodeData.priceLower as number) || ''}
                      onChange={(e) => handleDataChange('priceLower', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upper Price</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min={0}
                      placeholder="Upper bound"
                      value={(nodeData.priceUpper as number) || ''}
                      onChange={(e) => handleDataChange('priceUpper', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </>
              ) : isPercentage ? (
                <div className="space-y-2">
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    placeholder="e.g., 2.5"
                    value={(nodeData.percentage as number) || ''}
                    onChange={(e) => handleDataChange('percentage', parseFloat(e.target.value) || 0)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    placeholder="Target price"
                    value={(nodeData.price as number) || ''}
                    onChange={(e) => handleDataChange('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={(nodeData.trigger as string) || 'once'}
                  onValueChange={(v) => handleDataChange('trigger', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TRIGGERS.map((trig) => (
                      <SelectItem key={trig.value} value={trig.value}>
                        {trig.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select
                  value={(nodeData.expiration as string) || 'none'}
                  onValueChange={(v) => handleDataChange('expiration', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_EXPIRATION.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>
                        {exp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>Play Sound</Label>
                  <p className="text-xs text-muted-foreground">Alert sound on trigger</p>
                </div>
                <Switch
                  checked={(nodeData.playSound as boolean) ?? true}
                  onCheckedChange={(v) => handleDataChange('playSound', v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Alert Message</Label>
                <Input
                  placeholder="Custom alert message"
                  value={(nodeData.message as string) || ''}
                  onChange={(e) => handleDataChange('message', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ===== START/SCHEDULE NODE ===== */}
          {nodeType === 'start' && (
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

          {/* ===== PLACE ORDER NODE ===== */}
          {nodeType === 'placeOrder' && (
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

          {/* ===== OPTIONS ORDER NODE ===== */}
          {nodeType === 'optionsOrder' && (
            <>
              <div className="space-y-2">
                <Label>Underlying</Label>
                <Select
                  value={(nodeData.underlying as string) || 'NIFTY'}
                  onValueChange={(v) => {
                    handleDataChange('underlying', v)
                    const symbol = INDEX_SYMBOLS.find(s => s.value === v)
                    if (symbol) {
                      handleDataChange('quantity', symbol.lotSize)
                      handleDataChange('exchange', symbol.exchange)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDEX_SYMBOLS.map((sym) => (
                      <SelectItem key={sym.value} value={sym.value}>
                        {sym.label} ({sym.exchange}, Lot: {sym.lotSize})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiry</Label>
                <Select
                  value={(nodeData.expiryType as string) || 'current_week'}
                  onValueChange={(v) => handleDataChange('expiryType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_TYPES.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>
                        <div className="flex flex-col">
                          <span>{exp.label}</span>
                          <span className="text-xs text-muted-foreground">{exp.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Strike Offset</Label>
                <Select
                  value={(nodeData.offset as string) || 'ATM'}
                  onValueChange={(v) => handleDataChange('offset', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRIKE_OFFSETS.map((off) => (
                      <SelectItem key={off.value} value={off.value}>
                        {off.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Option Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {OPTION_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleDataChange('optionType', opt.value)}
                      className={cn(
                        'rounded-lg border py-2 text-sm font-semibold transition-colors',
                        nodeData.optionType === opt.value
                          ? opt.value === 'CE'
                            ? 'badge-buy'
                            : 'badge-sell'
                          : 'border-border bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                <Label>Quantity (Lots)</Label>
                <Input
                  type="number"
                  min={1}
                  value={(nodeData.quantity as number) || 75}
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
                    <SelectItem value="MIS">MIS (Intraday)</SelectItem>
                    <SelectItem value="NRML">NRML (Overnight)</SelectItem>
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
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {nodeData.priceType === 'LIMIT' && (
                <div className="space-y-2">
                  <Label>Limit Price</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0}
                    value={(nodeData.price as number) || 0}
                    onChange={(e) => handleDataChange('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </>
          )}

          {/* ===== OPTIONS MULTI-ORDER NODE ===== */}
          {nodeType === 'optionsMultiOrder' && (
            <>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select
                  value={(nodeData.strategy as string) || 'straddle'}
                  onValueChange={(v) => handleDataChange('strategy', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_STRATEGIES.map((strat) => (
                      <SelectItem key={strat.value} value={strat.value}>
                        <div className="flex flex-col">
                          <span>{strat.label}</span>
                          <span className="text-xs text-muted-foreground">{strat.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Underlying</Label>
                <Select
                  value={(nodeData.underlying as string) || 'NIFTY'}
                  onValueChange={(v) => {
                    handleDataChange('underlying', v)
                    const symbol = INDEX_SYMBOLS.find(s => s.value === v)
                    if (symbol) {
                      handleDataChange('exchange', symbol.exchange)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDEX_SYMBOLS.map((sym) => (
                      <SelectItem key={sym.value} value={sym.value}>
                        {sym.label} ({sym.exchange}, Lot: {sym.lotSize})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiry</Label>
                <Select
                  value={(nodeData.expiryType as string) || 'current_week'}
                  onValueChange={(v) => handleDataChange('expiryType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_TYPES.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>
                        <div className="flex flex-col">
                          <span>{exp.label}</span>
                          <span className="text-xs text-muted-foreground">{exp.description}</span>
                        </div>
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
                <p className="text-xs text-muted-foreground">
                  {nodeData.action === 'BUY' ? 'Long strategy (buy legs)' : 'Short strategy (sell legs)'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quantity (Lots per leg)</Label>
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
                    <SelectItem value="MIS">MIS (Intraday)</SelectItem>
                    <SelectItem value="NRML">NRML (Overnight)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strategy Preview */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium mb-2">Strategy Legs:</p>
                <div className="space-y-1 text-[10px] font-mono">
                  {nodeData.strategy === 'straddle' && (
                    <>
                      <div className="flex justify-between">
                        <span>ATM CE</span>
                        <span className={nodeData.action === 'BUY' ? 'text-buy' : 'text-sell'}>
                          {(nodeData.action as string) || 'SELL'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ATM PE</span>
                        <span className={nodeData.action === 'BUY' ? 'text-buy' : 'text-sell'}>
                          {(nodeData.action as string) || 'SELL'}
                        </span>
                      </div>
                    </>
                  )}
                  {nodeData.strategy === 'strangle' && (
                    <>
                      <div className="flex justify-between">
                        <span>OTM2 CE</span>
                        <span className={nodeData.action === 'BUY' ? 'text-buy' : 'text-sell'}>
                          {(nodeData.action as string) || 'SELL'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>OTM2 PE</span>
                        <span className={nodeData.action === 'BUY' ? 'text-buy' : 'text-sell'}>
                          {(nodeData.action as string) || 'SELL'}
                        </span>
                      </div>
                    </>
                  )}
                  {nodeData.strategy === 'iron_condor' && (
                    <>
                      <div className="flex justify-between">
                        <span>OTM2 CE</span>
                        <span className="text-sell">SELL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OTM4 CE</span>
                        <span className="text-buy">BUY</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OTM2 PE</span>
                        <span className="text-sell">SELL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OTM4 PE</span>
                        <span className="text-buy">BUY</span>
                      </div>
                    </>
                  )}
                  {nodeData.strategy === 'bull_call_spread' && (
                    <>
                      <div className="flex justify-between">
                        <span>ATM CE</span>
                        <span className="text-buy">BUY</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OTM2 CE</span>
                        <span className="text-sell">SELL</span>
                      </div>
                    </>
                  )}
                  {nodeData.strategy === 'bear_put_spread' && (
                    <>
                      <div className="flex justify-between">
                        <span>ATM PE</span>
                        <span className="text-buy">BUY</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OTM2 PE</span>
                        <span className="text-sell">SELL</span>
                      </div>
                    </>
                  )}
                  {nodeData.strategy === 'custom' && (
                    <p className="text-muted-foreground">Configure legs below</p>
                  )}
                </div>
              </div>

              {nodeData.strategy === 'strangle' && (
                <div className="space-y-2">
                  <Label>Strangle Width (OTM strikes)</Label>
                  <Select
                    value={(nodeData.strangleWidth as string) || 'OTM2'}
                    onValueChange={(v) => handleDataChange('strangleWidth', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OTM1">OTM 1 (Narrow)</SelectItem>
                      <SelectItem value="OTM2">OTM 2</SelectItem>
                      <SelectItem value="OTM3">OTM 3</SelectItem>
                      <SelectItem value="OTM4">OTM 4</SelectItem>
                      <SelectItem value="OTM5">OTM 5 (Wide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* ===== BASKET ORDER NODE ===== */}
          {nodeType === 'basketOrder' && (
            <>
              <div className="space-y-2">
                <Label>Basket Name</Label>
                <Input
                  placeholder="e.g., Morning Portfolio"
                  value={(nodeData.basketName as string) || ''}
                  onChange={(e) => handleDataChange('basketName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Orders (one per line: SYMBOL,EXCHANGE,ACTION,QTY)</Label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="RELIANCE,NSE,BUY,10&#10;INFY,NSE,BUY,5&#10;SBIN,NSE,SELL,20"
                  value={(nodeData.orders as string) || ''}
                  onChange={(e) => handleDataChange('orders', e.target.value)}
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
                        {type.label}
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
                    <SelectItem value="MARKET">MARKET</SelectItem>
                    <SelectItem value="LIMIT">LIMIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported exchanges: NSE, BSE, NFO, BFO, CDS, BCD, MCX
              </p>
            </>
          )}

          {/* ===== SPLIT ORDER NODE ===== */}
          {nodeType === 'splitOrder' && (
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
                <Label>Total Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={(nodeData.quantity as number) || 100}
                  onChange={(e) => handleDataChange('quantity', parseInt(e.target.value) || 100)}
                />
              </div>
              <div className="space-y-2">
                <Label>Split Size</Label>
                <Input
                  type="number"
                  min={1}
                  value={(nodeData.splitSize as number) || 10}
                  onChange={(e) => handleDataChange('splitSize', parseInt(e.target.value) || 10)}
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
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Will split into {Math.ceil(((nodeData.quantity as number) || 100) / ((nodeData.splitSize as number) || 10))} orders
              </p>
            </>
          )}

          {/* ===== MULTI QUOTES NODE ===== */}
          {nodeType === 'multiQuotes' && (
            <>
              <div className="space-y-2">
                <Label>Symbols (comma separated)</Label>
                <Input
                  placeholder="e.g., RELIANCE,INFY,TCS"
                  value={(nodeData.symbols as string) || ''}
                  onChange={(e) => handleDataChange('symbols', e.target.value.toUpperCase())}
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
                <Label>Output Variable</Label>
                <Input
                  placeholder="e.g., quotes"
                  value={(nodeData.outputVariable as string) || 'quotes'}
                  onChange={(e) => handleDataChange('outputVariable', e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Fetches quotes for multiple symbols at once
              </p>
            </>
          )}

          {/* ===== TELEGRAM ALERT NODE ===== */}
          {nodeType === 'telegramAlert' && (
            <>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  placeholder="Alert message"
                  value={(nodeData.message as string) || ''}
                  onChange={(e) => handleDataChange('message', e.target.value)}
                />
              </div>
            </>
          )}

          {/* ===== DELAY NODE ===== */}
          {nodeType === 'delay' && (
            <>
              <div className="space-y-2">
                <Label>Delay (milliseconds)</Label>
                <Input
                  type="number"
                  min={100}
                  step={100}
                  value={(nodeData.delayMs as number) || 1000}
                  onChange={(e) => handleDataChange('delayMs', parseInt(e.target.value) || 1000)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {((nodeData.delayMs as number) || 1000) / 1000} seconds
              </p>
            </>
          )}

          {/* ===== GET QUOTE NODE ===== */}
          {nodeType === 'getQuote' && (
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
            </>
          )}

          {/* ===== GET DEPTH NODE ===== */}
          {nodeType === 'getDepth' && (
            <>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g., SBIN"
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
            </>
          )}

          {/* ===== OPEN POSITION NODE ===== */}
          {nodeType === 'openPosition' && (
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
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ===== HISTORY NODE ===== */}
          {nodeType === 'history' && (
            <>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g., SBIN"
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
                <Label>Interval</Label>
                <Select
                  value={(nodeData.interval as string) || '1d'}
                  onValueChange={(v) => handleDataChange('interval', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="1d">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Days</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={(nodeData.days as number) || 30}
                  onChange={(e) => handleDataChange('days', parseInt(e.target.value) || 30)}
                />
              </div>
            </>
          )}

          {/* ===== EXPIRY NODE ===== */}
          {nodeType === 'expiry' && (
            <>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g., NIFTY"
                  value={(nodeData.symbol as string) || ''}
                  onChange={(e) => handleDataChange('symbol', e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label>Exchange</Label>
                <Select
                  value={(nodeData.exchange as string) || 'NFO'}
                  onValueChange={(v) => handleDataChange('exchange', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFO">NFO</SelectItem>
                    <SelectItem value="BFO">BFO</SelectItem>
                    <SelectItem value="MCX">MCX</SelectItem>
                    <SelectItem value="CDS">CDS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ===== VARIABLE NODE ===== */}
          {nodeType === 'variable' && (
            <>
              <div className="space-y-2">
                <Label>Variable Name</Label>
                <Input
                  placeholder="e.g., myLTP"
                  value={(nodeData.variableName as string) || ''}
                  onChange={(e) => handleDataChange('variableName', e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Use: {'{{' + ((nodeData.variableName as string) || 'varName') + '}}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Operation</Label>
                <Select
                  value={(nodeData.operation as string) || 'set'}
                  onValueChange={(v) => handleDataChange('operation', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIABLE_OPERATIONS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        <div className="flex flex-col">
                          <span>{op.label}</span>
                          <span className="text-xs text-muted-foreground">{op.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value input - show for set, add, subtract, multiply, divide, append, parse_json */}
              {['set', 'add', 'subtract', 'multiply', 'divide', 'append', 'parse_json'].includes(nodeData.operation as string) && (
                <div className="space-y-2">
                  <Label>
                    {nodeData.operation === 'parse_json' ? 'JSON String' : 'Value'}
                  </Label>
                  {nodeData.operation === 'parse_json' ? (
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      placeholder='{"key": "value"}'
                      value={String(nodeData.value || '')}
                      onChange={(e) => handleDataChange('value', e.target.value)}
                    />
                  ) : (
                    <Input
                      placeholder={['add', 'subtract', 'multiply', 'divide'].includes(nodeData.operation as string) ? 'Number' : 'Value or {{variable}}'}
                      value={String(nodeData.value || '')}
                      onChange={(e) => handleDataChange('value', e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* Source variable - for get and stringify operations */}
              {['get', 'stringify'].includes(nodeData.operation as string) && (
                <div className="space-y-2">
                  <Label>Source Variable</Label>
                  <Input
                    placeholder="e.g., quoteData"
                    value={(nodeData.sourceVariable as string) || ''}
                    onChange={(e) => handleDataChange('sourceVariable', e.target.value)}
                  />
                </div>
              )}

              {/* JSON path - for extracting nested values */}
              {nodeData.operation === 'get' && (
                <div className="space-y-2">
                  <Label>JSON Path (optional)</Label>
                  <Input
                    placeholder="e.g., data.ltp or results[0].price"
                    value={(nodeData.jsonPath as string) || ''}
                    onChange={(e) => handleDataChange('jsonPath', e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Access nested properties using dot notation
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium mb-1">Usage Examples:</p>
                <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
                  <p>{'{{variableName}}'} - Basic reference</p>
                  <p>{'{{quote.ltp}}'} - Nested value</p>
                  <p>{'{{positions[0].pnl}}'} - Array access</p>
                </div>
              </div>
            </>
          )}

          {/* ===== LOG NODE ===== */}
          {nodeType === 'log' && (
            <>
              <div className="space-y-2">
                <Label>Log Level</Label>
                <Select
                  value={(nodeData.level as string) || 'info'}
                  onValueChange={(v) => handleDataChange('level', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOG_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Log message with {{variables}}"
                  value={(nodeData.message as string) || ''}
                  onChange={(e) => handleDataChange('message', e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Use {'{{variableName}}'} to include variable values
                </p>
              </div>
            </>
          )}

          {/* ===== TIME WINDOW NODE ===== */}
          {nodeType === 'timeWindow' && (
            <>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={(nodeData.startTime as string) || '09:15'}
                  onChange={(e) => handleDataChange('startTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={(nodeData.endTime as string) || '15:30'}
                  onChange={(e) => handleDataChange('endTime', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>Invert Condition</Label>
                  <p className="text-xs text-muted-foreground">Trigger outside window</p>
                </div>
                <Switch
                  checked={(nodeData.invertCondition as boolean) || false}
                  onCheckedChange={(v) => handleDataChange('invertCondition', v)}
                />
              </div>
            </>
          )}

          {/* ===== PRICE CONDITION NODE ===== */}
          {nodeType === 'priceCondition' && (
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
                <Label>Field</Label>
                <Select
                  value={(nodeData.field as string) || 'ltp'}
                  onValueChange={(v) => handleDataChange('field', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltp">LTP</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="prev_close">Prev Close</SelectItem>
                    <SelectItem value="change_percent">Change %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={(nodeData.operator as string) || '>'}
                  onValueChange={(v) => handleDataChange('operator', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">Greater Than (&gt;)</SelectItem>
                    <SelectItem value="<">Less Than (&lt;)</SelectItem>
                    <SelectItem value="==">Equal (=)</SelectItem>
                    <SelectItem value=">=">Greater or Equal (&gt;=)</SelectItem>
                    <SelectItem value="<=">Less or Equal (&lt;=)</SelectItem>
                    <SelectItem value="!=">Not Equal (!=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  step="0.05"
                  placeholder="Price value"
                  value={(nodeData.value as number) || ''}
                  onChange={(e) => handleDataChange('value', parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {/* ===== GROUP NODE ===== */}
          {nodeType === 'group' && (
            <>
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  placeholder="e.g., Entry Logic"
                  value={(nodeData.label as string) || ''}
                  onChange={(e) => handleDataChange('label', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={(nodeData.color as string) || 'default'}
                  onValueChange={(v) => handleDataChange('color', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ===== POSITION CHECK NODE ===== */}
          {nodeType === 'positionCheck' && (
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
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={(nodeData.condition as string) || 'exists'}
                  onValueChange={(v) => handleDataChange('condition', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exists">Has Position</SelectItem>
                    <SelectItem value="not_exists">No Position</SelectItem>
                    <SelectItem value="quantity_above">Quantity Above</SelectItem>
                    <SelectItem value="quantity_below">Quantity Below</SelectItem>
                    <SelectItem value="pnl_above">P&L Above</SelectItem>
                    <SelectItem value="pnl_below">P&L Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {['quantity_above', 'quantity_below', 'pnl_above', 'pnl_below'].includes(nodeData.condition as string) && (
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <Input
                    type="number"
                    placeholder="Value"
                    value={(nodeData.threshold as number) || ''}
                    onChange={(e) => handleDataChange('threshold', parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </>
          )}

          {/* ===== FUND CHECK NODE ===== */}
          {nodeType === 'fundCheck' && (
            <>
              <div className="space-y-2">
                <Label>Minimum Available Funds</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g., 10000"
                  value={(nodeData.minAvailable as number) || ''}
                  onChange={(e) => handleDataChange('minAvailable', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Checks if available margin is above this amount
                </p>
              </div>
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
