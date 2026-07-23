import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: string;
  nodeName: string;
  description?: string;
  inputSchema?: string;
  outputSchema?: string;
  configJson: string;
  runtimeConfig?: string;
  dbId?: string;
}

export interface WorkflowStore {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;

  setNodes: (nodes: Node<WorkflowNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange<Node<WorkflowNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node<WorkflowNodeData>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, patch: Partial<WorkflowNodeData>) => void;
  updateNodeName: (id: string, name: string) => void;
  updateNodeConfig: (id: string, patch: Record<string, any>) => void;
  loadFromDB: (nodes: any[], edges: any[]) => void;
  markClean: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<WorkflowNodeData>[],
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        { ...connection, type: "default", style: { stroke: "#d1d5db", strokeWidth: 1, opacity: 0.8 } },
        get().edges
      ),
      isDirty: true,
    });
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node], isDirty: true });
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      isDirty: true,
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
      ),
      isDirty: true,
    });
  },

  updateNodeName: (id, name) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, nodeName: name } } : n
      ),
      isDirty: true,
    });
  },

  updateNodeConfig: (id, patch) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id !== id) return n;
        const cfg = JSON.parse(n.data.configJson || "{}");
        return {
          ...n,
          data: { ...n.data, configJson: JSON.stringify({ ...cfg, ...patch }) },
        };
      }),
      isDirty: true,
    });
  },

  loadFromDB: (dbNodes, dbEdges) => {
    const rfnodes: Node<WorkflowNodeData>[] = dbNodes.map((n: any) => ({
      id: n.id,
      type: n.nodeType.toLowerCase(),
      position: { x: n.positionX || 0, y: n.positionY || 0 },
      data: {
        nodeType: n.nodeType,
        nodeName: n.nodeName,
        description: n.description || "",
        inputSchema: n.inputSchema || "[]",
        outputSchema: n.outputSchema || "[]",
        configJson: n.configJson || "{}",
        runtimeConfig: n.runtimeConfig || "{}",
        dbId: n.id,
      },
    }));
    const rfedges: Edge[] = dbEdges.map((e: any) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourcePort || "out",
      targetHandle: e.targetPort || "in",
      label: e.condition && e.condition !== "always" ? e.condition : undefined,
      type: "default",
      style: { stroke: "#d1d5db", strokeWidth: 1, opacity: 0.8 },
    }));
    set({ nodes: rfnodes, edges: rfedges, selectedNodeId: null, isDirty: false });
  },

  markClean: () => set({ isDirty: false }),
}));

// Selector helpers
export const useSelectedNode = () => {
  const { nodes, selectedNodeId } = useWorkflowStore();
  return nodes.find((n) => n.id === selectedNodeId) || null;
};
