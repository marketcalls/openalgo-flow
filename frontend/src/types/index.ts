import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

// Start Node Data
export interface StartNodeData {
  label?: string;
  scheduleType: 'once' | 'daily' | 'weekly';
  time: string;
  days?: number[];
  executeAt?: string;
}

// Place Order Node Data
export interface PlaceOrderNodeData {
  label?: string;
  symbol: string;
  exchange: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  priceType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  product: 'MIS' | 'CNC' | 'NRML';
  price?: number;
  triggerPrice?: number;
  ltp?: number;
}

// Union of all node data types
export type NodeData = StartNodeData | PlaceOrderNodeData;

// Custom Node Types
export type StartNode = ReactFlowNode<StartNodeData, 'start'>;
export type PlaceOrderNode = ReactFlowNode<PlaceOrderNodeData, 'placeOrder'>;
export type CustomNode = StartNode | PlaceOrderNode;

// Custom Edge Type
export type CustomEdge = ReactFlowEdge;

// Workflow Store State
export interface WorkflowState {
  id: number | null;
  name: string;
  description: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  selectedNodeId: string | null;
  isModified: boolean;
}

// Settings State
export interface SettingsState {
  openalgo_host: string;
  openalgo_ws_url: string;
  is_configured: boolean;
  has_api_key: boolean;
}
