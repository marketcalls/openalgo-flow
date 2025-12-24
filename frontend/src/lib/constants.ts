// =============================================================================
// EXCHANGE CONSTANTS
// =============================================================================

export const EXCHANGES = [
  { value: 'NSE', label: 'NSE' },
  { value: 'BSE', label: 'BSE' },
  { value: 'NFO', label: 'NFO' },
  { value: 'BFO', label: 'BFO' },
  { value: 'CDS', label: 'CDS' },
  { value: 'BCD', label: 'BCD' },
  { value: 'MCX', label: 'MCX' },
  { value: 'NSE_INDEX', label: 'NSE_INDEX' },
  { value: 'BSE_INDEX', label: 'BSE_INDEX' },
] as const

export const INDEX_EXCHANGES = [
  { value: 'NSE_INDEX', label: 'NSE_INDEX' },
  { value: 'BSE_INDEX', label: 'BSE_INDEX' },
] as const

// =============================================================================
// PRODUCT & ORDER TYPES
// =============================================================================

export const PRODUCT_TYPES = [
  { value: 'MIS', label: 'MIS', description: 'Intraday (auto square-off)' },
  { value: 'CNC', label: 'CNC', description: 'Cash & Carry for equity delivery' },
  { value: 'NRML', label: 'NRML', description: 'Normal for futures and options' },
] as const

export const PRICE_TYPES = [
  { value: 'MARKET', label: 'Market', description: 'Execute at current market price' },
  { value: 'LIMIT', label: 'Limit', description: 'Execute at specified price or better' },
  { value: 'SL', label: 'Stop Loss Limit', description: 'Stop loss with limit price' },
  { value: 'SL-M', label: 'Stop Loss Market', description: 'Stop loss at market price' },
] as const

export const ORDER_ACTIONS = [
  { value: 'BUY', label: 'BUY', color: 'badge-buy' },
  { value: 'SELL', label: 'SELL', color: 'badge-sell' },
] as const

// =============================================================================
// OPTIONS TRADING CONSTANTS
// =============================================================================

export const OPTION_TYPES = [
  { value: 'CE', label: 'Call (CE)', description: 'Call Option' },
  { value: 'PE', label: 'Put (PE)', description: 'Put Option' },
] as const

export const STRIKE_OFFSETS = [
  { value: 'ATM', label: 'ATM', description: 'At The Money' },
  { value: 'ITM1', label: 'ITM1', description: '1 strike In The Money' },
  { value: 'ITM2', label: 'ITM2', description: '2 strikes In The Money' },
  { value: 'ITM3', label: 'ITM3', description: '3 strikes In The Money' },
  { value: 'ITM4', label: 'ITM4', description: '4 strikes In The Money' },
  { value: 'ITM5', label: 'ITM5', description: '5 strikes In The Money' },
  { value: 'OTM1', label: 'OTM1', description: '1 strike Out of The Money' },
  { value: 'OTM2', label: 'OTM2', description: '2 strikes Out of The Money' },
  { value: 'OTM3', label: 'OTM3', description: '3 strikes Out of The Money' },
  { value: 'OTM4', label: 'OTM4', description: '4 strikes Out of The Money' },
  { value: 'OTM5', label: 'OTM5', description: '5 strikes Out of The Money' },
  { value: 'OTM6', label: 'OTM6', description: '6 strikes Out of The Money' },
  { value: 'OTM7', label: 'OTM7', description: '7 strikes Out of The Money' },
  { value: 'OTM8', label: 'OTM8', description: '8 strikes Out of The Money' },
  { value: 'OTM9', label: 'OTM9', description: '9 strikes Out of The Money' },
  { value: 'OTM10', label: 'OTM10', description: '10 strikes Out of The Money' },
] as const

export const OPTION_STRATEGIES = [
  { value: 'iron_condor', label: 'Iron Condor', description: 'Sell OTM Call & Put, Buy further OTM Call & Put' },
  { value: 'straddle', label: 'Straddle', description: 'Buy/Sell ATM Call and Put' },
  { value: 'strangle', label: 'Strangle', description: 'Buy/Sell OTM Call and Put' },
  { value: 'bull_call_spread', label: 'Bull Call Spread', description: 'Buy lower strike Call, Sell higher strike Call' },
  { value: 'bear_put_spread', label: 'Bear Put Spread', description: 'Buy higher strike Put, Sell lower strike Put' },
  { value: 'custom', label: 'Custom', description: 'Build custom multi-leg strategy' },
] as const

// =============================================================================
// INDEX SYMBOLS
// =============================================================================

export const NSE_INDEX_SYMBOLS = [
  { value: 'NIFTY', label: 'NIFTY 50', lotSize: 75 },
  { value: 'BANKNIFTY', label: 'Bank NIFTY', lotSize: 30 },
  { value: 'FINNIFTY', label: 'Fin NIFTY', lotSize: 40 },
  { value: 'MIDCPNIFTY', label: 'Midcap NIFTY', lotSize: 75 },
  { value: 'NIFTYNXT50', label: 'NIFTY Next 50', lotSize: 25 },
] as const

export const BSE_INDEX_SYMBOLS = [
  { value: 'SENSEX', label: 'SENSEX', lotSize: 20 },
  { value: 'BANKEX', label: 'BANKEX', lotSize: 30 },
  { value: 'SENSEX50', label: 'SENSEX 50', lotSize: 25 },
] as const

// =============================================================================
// SCHEDULE CONSTANTS
// =============================================================================

export const SCHEDULE_TYPES = [
  { value: 'once', label: 'Once', description: 'Execute one time at specified date/time' },
  { value: 'daily', label: 'Daily', description: 'Execute every day at specified time' },
  { value: 'weekly', label: 'Weekly', description: 'Execute on selected days of the week' },
  { value: 'interval', label: 'Interval', description: 'Execute every X minutes' },
] as const

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Mon', fullLabel: 'Monday' },
  { value: 1, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 2, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 3, label: 'Thu', fullLabel: 'Thursday' },
  { value: 4, label: 'Fri', fullLabel: 'Friday' },
  { value: 5, label: 'Sat', fullLabel: 'Saturday' },
  { value: 6, label: 'Sun', fullLabel: 'Sunday' },
] as const

// =============================================================================
// CONDITION OPERATORS
// =============================================================================

export const CONDITION_OPERATORS = [
  { value: '>', label: '>', description: 'Greater than' },
  { value: '<', label: '<', description: 'Less than' },
  { value: '==', label: '=', description: 'Equal to' },
  { value: '>=', label: '>=', description: 'Greater than or equal' },
  { value: '<=', label: '<=', description: 'Less than or equal' },
  { value: '!=', label: '!=', description: 'Not equal to' },
] as const

export const PRICE_ALERT_CONDITIONS = [
  { value: 'above', label: 'Price Above', description: 'Trigger when price goes above' },
  { value: 'below', label: 'Price Below', description: 'Trigger when price goes below' },
  { value: 'crosses_above', label: 'Crosses Above', description: 'Trigger when price crosses above' },
  { value: 'crosses_below', label: 'Crosses Below', description: 'Trigger when price crosses below' },
] as const

export const POSITION_CONDITIONS = [
  { value: 'exists', label: 'Position Exists', description: 'Has an open position' },
  { value: 'not_exists', label: 'No Position', description: 'No open position' },
  { value: 'quantity_above', label: 'Qty Above', description: 'Position quantity above threshold' },
  { value: 'quantity_below', label: 'Qty Below', description: 'Position quantity below threshold' },
  { value: 'pnl_above', label: 'P&L Above', description: 'Position P&L above threshold' },
  { value: 'pnl_below', label: 'P&L Below', description: 'Position P&L below threshold' },
] as const

export const GREEKS = [
  { value: 'delta', label: 'Delta', description: 'Price sensitivity' },
  { value: 'gamma', label: 'Gamma', description: 'Delta sensitivity' },
  { value: 'theta', label: 'Theta', description: 'Time decay' },
  { value: 'vega', label: 'Vega', description: 'Volatility sensitivity' },
  { value: 'iv', label: 'IV', description: 'Implied Volatility' },
] as const

// =============================================================================
// NODE CATEGORIES & DEFINITIONS
// =============================================================================

export const NODE_CATEGORIES = {
  TRIGGERS: 'triggers',
  ACTIONS: 'actions',
  CONDITIONS: 'conditions',
  DATA: 'data',
  UTILITIES: 'utilities',
} as const

export const NODE_DEFINITIONS = {
  // Trigger Nodes
  TRIGGERS: [
    {
      type: 'start',
      label: 'Schedule',
      description: 'Start workflow on schedule',
      category: 'trigger' as const,
    },
    {
      type: 'priceAlert',
      label: 'Price Alert',
      description: 'Trigger on price condition',
      category: 'trigger' as const,
    },
  ],

  // Action Nodes
  ACTIONS: [
    {
      type: 'placeOrder',
      label: 'Place Order',
      description: 'Place a trading order',
      category: 'action' as const,
    },
    {
      type: 'smartOrder',
      label: 'Smart Order',
      description: 'Position-aware order',
      category: 'action' as const,
    },
    {
      type: 'optionsOrder',
      label: 'Options Order',
      description: 'Trade ATM/ITM/OTM options',
      category: 'action' as const,
    },
    {
      type: 'optionsMultiOrder',
      label: 'Options Strategy',
      description: 'Multi-leg options strategy',
      category: 'action' as const,
    },
    {
      type: 'basketOrder',
      label: 'Basket Order',
      description: 'Place multiple orders at once',
      category: 'action' as const,
    },
    {
      type: 'splitOrder',
      label: 'Split Order',
      description: 'Split large order into chunks',
      category: 'action' as const,
    },
    {
      type: 'modifyOrder',
      label: 'Modify Order',
      description: 'Modify an existing order',
      category: 'action' as const,
    },
    {
      type: 'cancelOrder',
      label: 'Cancel Order',
      description: 'Cancel a specific order',
      category: 'action' as const,
    },
    {
      type: 'cancelAllOrders',
      label: 'Cancel All',
      description: 'Cancel all open orders',
      category: 'action' as const,
    },
    {
      type: 'closePositions',
      label: 'Close Positions',
      description: 'Square off all positions',
      category: 'action' as const,
    },
  ],

  // Condition Nodes
  CONDITIONS: [
    {
      type: 'condition',
      label: 'If/Else',
      description: 'Conditional branching',
      category: 'condition' as const,
    },
    {
      type: 'positionCheck',
      label: 'Position Check',
      description: 'Check position status',
      category: 'condition' as const,
    },
    {
      type: 'fundCheck',
      label: 'Fund Check',
      description: 'Check available funds',
      category: 'condition' as const,
    },
    {
      type: 'priceCondition',
      label: 'Price Check',
      description: 'Check price condition',
      category: 'condition' as const,
    },
    {
      type: 'timeWindow',
      label: 'Time Window',
      description: 'Check market hours',
      category: 'condition' as const,
    },
    {
      type: 'greeksCondition',
      label: 'Greeks Check',
      description: 'Check option greeks',
      category: 'condition' as const,
    },
  ],

  // Data Nodes
  DATA: [
    {
      type: 'getQuote',
      label: 'Get Quote',
      description: 'Fetch real-time quote',
      category: 'data' as const,
    },
    {
      type: 'getMultiQuotes',
      label: 'Multi Quotes',
      description: 'Fetch multiple quotes',
      category: 'data' as const,
    },
    {
      type: 'getOptionChain',
      label: 'Option Chain',
      description: 'Fetch option chain',
      category: 'data' as const,
    },
    {
      type: 'getPositions',
      label: 'Get Positions',
      description: 'Fetch current positions',
      category: 'data' as const,
    },
    {
      type: 'getHoldings',
      label: 'Get Holdings',
      description: 'Fetch portfolio holdings',
      category: 'data' as const,
    },
    {
      type: 'getOrderStatus',
      label: 'Order Status',
      description: 'Check order status',
      category: 'data' as const,
    },
    {
      type: 'calculateGreeks',
      label: 'Calc Greeks',
      description: 'Calculate option greeks',
      category: 'data' as const,
    },
    {
      type: 'getDepth',
      label: 'Market Depth',
      description: 'Fetch bid/ask depth',
      category: 'data' as const,
    },
    {
      type: 'history',
      label: 'History',
      description: 'Fetch OHLCV data',
      category: 'data' as const,
    },
    {
      type: 'openPosition',
      label: 'Open Position',
      description: 'Get position for symbol',
      category: 'data' as const,
    },
    {
      type: 'expiry',
      label: 'Expiry Dates',
      description: 'Fetch F&O expiry dates',
      category: 'data' as const,
    },
    {
      type: 'intervals',
      label: 'Intervals',
      description: 'Available time intervals',
      category: 'data' as const,
    },
  ],

  // Utility Nodes
  UTILITIES: [
    {
      type: 'telegramAlert',
      label: 'Telegram Alert',
      description: 'Send Telegram notification',
      category: 'utility' as const,
    },
    {
      type: 'delay',
      label: 'Delay',
      description: 'Wait for duration',
      category: 'utility' as const,
    },
    {
      type: 'log',
      label: 'Log',
      description: 'Log a message',
      category: 'utility' as const,
    },
    {
      type: 'variable',
      label: 'Variable',
      description: 'Set/calculate variable',
      category: 'utility' as const,
    },
    {
      type: 'group',
      label: 'Group',
      description: 'Group related nodes',
      category: 'utility' as const,
    },
  ],
} as const

// Legacy export for backward compatibility
export const NODE_TYPES = {
  TRIGGERS: NODE_DEFINITIONS.TRIGGERS,
  ACTIONS: NODE_DEFINITIONS.ACTIONS,
} as const

// =============================================================================
// DEFAULT NODE DATA
// =============================================================================

export const DEFAULT_NODE_DATA = {
  start: {
    scheduleType: 'daily' as const,
    time: '09:15',
    marketHoursOnly: true,
  },
  priceAlert: {
    symbol: '',
    exchange: 'NSE',
    condition: 'above' as const,
    price: 0,
  },
  placeOrder: {
    symbol: '',
    exchange: 'NSE',
    action: 'BUY' as const,
    quantity: 1,
    priceType: 'MARKET' as const,
    product: 'MIS' as const,
  },
  smartOrder: {
    symbol: '',
    exchange: 'NSE',
    action: 'BUY' as const,
    quantity: 1,
    positionSize: 0,
    priceType: 'MARKET' as const,
    product: 'MIS' as const,
  },
  optionsOrder: {
    underlying: 'NIFTY',
    exchange: 'NSE_INDEX' as const,
    expiryDate: '',
    offset: 'ATM',
    optionType: 'CE' as const,
    action: 'BUY' as const,
    quantity: 75,
    priceType: 'MARKET' as const,
    product: 'MIS' as const,
  },
  optionsMultiOrder: {
    strategy: 'straddle' as const,
    underlying: 'NIFTY',
    exchange: 'NSE_INDEX' as const,
    expiryDate: '',
    legs: [],
    priceType: 'MARKET' as const,
    product: 'MIS' as const,
  },
  cancelAllOrders: {},
  closePositions: {},
  condition: {
    conditions: [{ variable: 'ltp', operator: '>' as const, value: 0 }],
    logic: 'AND' as const,
  },
  positionCheck: {
    symbol: '',
    exchange: 'NSE',
    product: 'MIS' as const,
    condition: 'exists' as const,
  },
  fundCheck: {
    minAvailable: 10000,
  },
  timeWindow: {
    startTime: '09:15',
    endTime: '15:30',
  },
  getQuote: {
    symbol: '',
    exchange: 'NSE',
  },
  getPositions: {},
  getHoldings: {},
  telegramAlert: {
    message: 'Workflow executed successfully',
  },
  delay: {
    delayMs: 1000,
  },
  log: {
    message: 'Log message here',
    level: 'info' as const,
  },
  variable: {
    variableName: 'myVar',
    operation: 'set' as const,
    value: '',
  },
  getOrderStatus: {
    orderId: '',
    waitForCompletion: false,
  },
  getDepth: {
    symbol: '',
    exchange: 'NSE',
  },
  history: {
    symbol: '',
    exchange: 'NSE',
    interval: '1d' as const,
    days: 30,
  },
  openPosition: {
    symbol: '',
    exchange: 'NSE',
    product: 'MIS' as const,
  },
  expiry: {
    symbol: 'NIFTY',
    exchange: 'NFO',
  },
  intervals: {},
  cancelOrder: {
    orderId: '',
  },
  modifyOrder: {
    orderId: '',
    symbol: '',
    exchange: 'NSE',
    action: 'BUY' as const,
  },
  basketOrder: {
    orders: [],
  },
  splitOrder: {
    symbol: '',
    exchange: 'NSE',
    action: 'BUY' as const,
    quantity: 100,
    splitSize: 50,
    priceType: 'MARKET' as const,
    product: 'MIS' as const,
  },
  priceCondition: {
    symbol: '',
    exchange: 'NSE',
    field: 'ltp' as const,
    operator: '>' as const,
    value: 0,
  },
  group: {
    label: 'Group',
    color: 'default',
  },
} as const

// =============================================================================
// API & SETTINGS
// =============================================================================

export const DEFAULT_SETTINGS = {
  openalgo_host: 'http://127.0.0.1:5000',
  openalgo_ws_url: 'ws://127.0.0.1:8765',
} as const

export const API_ENDPOINTS = {
  SETTINGS: '/api/settings',
  SETTINGS_TEST: '/api/settings/test',
  WORKFLOWS: '/api/workflows',
  SYMBOLS_SEARCH: '/api/symbols/search',
  SYMBOLS_QUOTES: '/api/symbols/quotes',
  PORTFOLIO_FUNDS: '/api/portfolio/funds',
  PORTFOLIO_POSITIONS: '/api/portfolio/positions',
  PORTFOLIO_HOLDINGS: '/api/portfolio/holdings',
  PORTFOLIO_ORDERS: '/api/portfolio/orders',
  PORTFOLIO_TRADES: '/api/portfolio/trades',
  OPTIONS_CHAIN: '/api/options/chain',
  OPTIONS_EXPIRY: '/api/options/expiry',
  OPTIONS_GREEKS: '/api/options/greeks',
} as const
