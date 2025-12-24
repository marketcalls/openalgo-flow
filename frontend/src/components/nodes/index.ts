/**
 * Node Components Index
 * Export all workflow node components
 */

// Trigger Nodes
import { StartNode } from './StartNode'
import { PriceAlertNode } from './PriceAlertNode'

// Action Nodes
import { PlaceOrderNode } from './PlaceOrderNode'
import { SmartOrderNode } from './SmartOrderNode'
import { OptionsOrderNode } from './OptionsOrderNode'
import { OptionsMultiOrderNode } from './OptionsMultiOrderNode'
import { CancelAllOrdersNode } from './CancelAllOrdersNode'
import { ClosePositionsNode } from './ClosePositionsNode'
import { CancelOrderNode } from './CancelOrderNode'
import { ModifyOrderNode } from './ModifyOrderNode'
import { BasketOrderNode } from './BasketOrderNode'
import { SplitOrderNode } from './SplitOrderNode'

// Condition Nodes
import { PositionCheckNode } from './PositionCheckNode'
import { FundCheckNode } from './FundCheckNode'
import { TimeWindowNode } from './TimeWindowNode'
import { PriceConditionNode } from './PriceConditionNode'

// Data Nodes
import { GetQuoteNode } from './GetQuoteNode'
import { GetDepthNode } from './GetDepthNode'
import { GetOrderStatusNode } from './GetOrderStatusNode'
import { HistoryNode } from './HistoryNode'
import { OpenPositionNode } from './OpenPositionNode'
import { ExpiryNode } from './ExpiryNode'
import { IntervalsNode } from './IntervalsNode'
import { MultiQuotesNode } from './MultiQuotesNode'

// Utility Nodes
import { TelegramAlertNode } from './TelegramAlertNode'
import { DelayNode } from './DelayNode'
import { GroupNode } from './GroupNode'
import { VariableNode } from './VariableNode'
import { LogNode } from './LogNode'

// Base Components
export { BaseNode, NodeDataRow, NodeBadge, NodeInfoRow } from './BaseNode'

// Re-export individual nodes
export {
  // Triggers
  StartNode,
  PriceAlertNode,
  // Actions
  PlaceOrderNode,
  SmartOrderNode,
  OptionsOrderNode,
  OptionsMultiOrderNode,
  CancelAllOrdersNode,
  ClosePositionsNode,
  CancelOrderNode,
  ModifyOrderNode,
  BasketOrderNode,
  SplitOrderNode,
  // Conditions
  PositionCheckNode,
  FundCheckNode,
  TimeWindowNode,
  PriceConditionNode,
  // Data
  GetQuoteNode,
  GetDepthNode,
  GetOrderStatusNode,
  HistoryNode,
  OpenPositionNode,
  ExpiryNode,
  IntervalsNode,
  MultiQuotesNode,
  // Utilities
  TelegramAlertNode,
  DelayNode,
  GroupNode,
  VariableNode,
  LogNode,
}

/**
 * Node type registry for ReactFlow
 * Maps node type strings to their components
 */
export const nodeTypes = {
  // Triggers
  start: StartNode,
  priceAlert: PriceAlertNode,

  // Actions
  placeOrder: PlaceOrderNode,
  smartOrder: SmartOrderNode,
  optionsOrder: OptionsOrderNode,
  optionsMultiOrder: OptionsMultiOrderNode,
  cancelAllOrders: CancelAllOrdersNode,
  closePositions: ClosePositionsNode,
  cancelOrder: CancelOrderNode,
  modifyOrder: ModifyOrderNode,
  basketOrder: BasketOrderNode,
  splitOrder: SplitOrderNode,

  // Conditions
  positionCheck: PositionCheckNode,
  fundCheck: FundCheckNode,
  timeWindow: TimeWindowNode,
  priceCondition: PriceConditionNode,

  // Data
  getQuote: GetQuoteNode,
  getDepth: GetDepthNode,
  getOrderStatus: GetOrderStatusNode,
  history: HistoryNode,
  openPosition: OpenPositionNode,
  expiry: ExpiryNode,
  intervals: IntervalsNode,
  multiQuotes: MultiQuotesNode,

  // Utilities
  telegramAlert: TelegramAlertNode,
  delay: DelayNode,
  group: GroupNode,
  variable: VariableNode,
  log: LogNode,
} as const
