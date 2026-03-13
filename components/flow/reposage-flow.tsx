"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import { useCallback } from "react";
import { useFlowStore } from "@/stores/flow-store";

const defaultNodes: Node[] = [
  { id: "1", type: "default", position: { x: 0, y: 0 }, data: { label: "Start" } },
  { id: "2", type: "default", position: { x: 200, y: 100 }, data: { label: "Node 2" } },
];
const defaultEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

export function RepoSageFlow() {
  const storeNodes = useFlowStore((s) => s.nodes);
  const storeEdges = useFlowStore((s) => s.edges);

  const initialNodes = storeNodes.length > 0 ? storeNodes : defaultNodes;
  const initialEdges = storeEdges.length > 0 ? storeEdges : defaultEdges;

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: { source: string | null; target: string | null }) => {
      const { source, target } = params;
      if (!source || !target) return;
      setEdges((prev) => [
        ...prev,
        { id: `e${source}-${target}`, source, target },
      ]);
    },
    [setEdges]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
