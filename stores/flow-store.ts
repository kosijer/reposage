import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [
    { id: "1", type: "default", position: { x: 0, y: 0 }, data: { label: "Start" } },
    { id: "2", type: "default", position: { x: 200, y: 100 }, data: { label: "Node 2" } },
  ],
  edges: [{ id: "e1-2", source: "1", target: "2" }],

  setNodes: (updater) =>
    set((state) => ({
      nodes: typeof updater === "function" ? updater(state.nodes) : updater,
    })),

  setEdges: (updater) =>
    set((state) => ({
      edges: typeof updater === "function" ? updater(state.edges) : updater,
    })),

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),
}));
