/**
 * Edge Components Index
 * Export all custom edge components
 */

import { InsertableEdge } from './InsertableEdge'

export { InsertableEdge }

/**
 * Edge type registry for ReactFlow
 * Maps edge type strings to their components
 */
export const edgeTypes = {
  insertable: InsertableEdge,
} as const
