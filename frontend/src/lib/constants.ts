// OpenAlgo Exchange Constants
export const EXCHANGES = [
  { value: 'NSE', label: 'NSE Equity', description: 'National Stock Exchange Equity' },
  { value: 'NFO', label: 'NSE F&O', description: 'NSE Futures & Options' },
  { value: 'CDS', label: 'NSE Currency', description: 'NSE Currency Derivatives' },
  { value: 'BSE', label: 'BSE Equity', description: 'Bombay Stock Exchange Equity' },
  { value: 'BFO', label: 'BSE F&O', description: 'BSE Futures & Options' },
  { value: 'BCD', label: 'BSE Currency', description: 'BSE Currency Derivatives' },
  { value: 'MCX', label: 'MCX Commodity', description: 'Multi Commodity Exchange' },
  { value: 'NCDEX', label: 'NCDEX', description: 'NCDEX Commodity' },
  { value: 'NSE_INDEX', label: 'NSE Index', description: 'NSE Indices' },
  { value: 'BSE_INDEX', label: 'BSE Index', description: 'BSE Indices' },
] as const;

// Product Types
export const PRODUCT_TYPES = [
  { value: 'CNC', label: 'CNC', description: 'Cash & Carry for equity delivery' },
  { value: 'NRML', label: 'NRML', description: 'Normal for futures and options' },
  { value: 'MIS', label: 'MIS', description: 'Intraday (auto square-off)' },
] as const;

// Price/Order Types
export const PRICE_TYPES = [
  { value: 'MARKET', label: 'Market', description: 'Execute at current market price' },
  { value: 'LIMIT', label: 'Limit', description: 'Execute at specified price or better' },
  { value: 'SL', label: 'Stop Loss Limit', description: 'Stop loss with limit price' },
  { value: 'SL-M', label: 'Stop Loss Market', description: 'Stop loss at market price' },
] as const;

// Order Actions
export const ORDER_ACTIONS = [
  { value: 'BUY', label: 'BUY', color: 'text-green-600 bg-green-50' },
  { value: 'SELL', label: 'SELL', color: 'text-red-600 bg-red-50' },
] as const;

// Common NSE Index Symbols
export const NSE_INDEX_SYMBOLS = [
  'NIFTY',
  'NIFTYNXT50',
  'FINNIFTY',
  'BANKNIFTY',
  'MIDCPNIFTY',
  'INDIAVIX',
] as const;

// Common BSE Index Symbols
export const BSE_INDEX_SYMBOLS = [
  'SENSEX',
  'BANKEX',
  'SENSEX50',
] as const;

// Schedule Types for Start Node
export const SCHEDULE_TYPES = [
  { value: 'once', label: 'Once', description: 'Execute one time at specified date/time' },
  { value: 'daily', label: 'Daily', description: 'Execute every day at specified time' },
  { value: 'weekly', label: 'Weekly', description: 'Execute on selected days of the week' },
] as const;

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Mon', fullLabel: 'Monday' },
  { value: 1, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 2, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 3, label: 'Thu', fullLabel: 'Thursday' },
  { value: 4, label: 'Fri', fullLabel: 'Friday' },
  { value: 5, label: 'Sat', fullLabel: 'Saturday' },
  { value: 6, label: 'Sun', fullLabel: 'Sunday' },
] as const;

// Node Types for Workflow Editor
export const NODE_TYPES = {
  TRIGGERS: [
    { type: 'start', label: 'Schedule', description: 'Start workflow on schedule' },
  ],
  ACTIONS: [
    { type: 'placeOrder', label: 'Place Order', description: 'Place a trading order' },
  ],
} as const;

// Default OpenAlgo Settings
export const DEFAULT_SETTINGS = {
  openalgo_host: 'http://127.0.0.1:5000',
  openalgo_ws_url: 'ws://127.0.0.1:8765',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  SETTINGS: '/api/settings',
  SETTINGS_TEST: '/api/settings/test',
  WORKFLOWS: '/api/workflows',
  SYMBOLS_SEARCH: '/api/symbols/search',
  SYMBOLS_QUOTES: '/api/symbols/quotes',
} as const;
