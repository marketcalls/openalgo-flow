import { create } from 'zustand'
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

interface WorkflowState {
  id: number | null
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  isModified: boolean

  // Actions
  setWorkflow: (workflow: {
    id: number | null
    name: string
    description: string
    nodes: Node[]
    edges: Edge[]
  }) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node) => void
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setName: (name: string) => void
  setDescription: (description: string) => void
  resetWorkflow: () => void
  markSaved: () => void
}

const initialState = {
  id: null,
  name: 'Untitled Workflow',
  description: '',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isModified: false,
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,

  setWorkflow: (workflow) => set({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes,
    edges: workflow.edges,
    isModified: false,
    selectedNodeId: null,
  }),

  setNodes: (nodes) => set({ nodes, isModified: true }),

  setEdges: (edges) => set({ edges, isModified: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isModified: true,
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isModified: true,
    })
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          id: `edge-${Date.now()}`,
        },
        get().edges
      ),
      isModified: true,
    })
  },

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
    isModified: true,
  })),

  updateNodeData: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ),
    isModified: true,
  })),

  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((node) => node.id !== nodeId),
    edges: state.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    isModified: true,
  })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setName: (name) => set({ name, isModified: true }),

  setDescription: (description) => set({ description, isModified: true }),

  resetWorkflow: () => set(initialState),

  markSaved: () => set({ isModified: false }),
}))
