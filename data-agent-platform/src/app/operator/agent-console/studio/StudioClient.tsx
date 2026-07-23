"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore, useSelectedNode, type WorkflowNodeData } from "./workflowStore";
import { NODE_PALETTE, getNodeStyle, type NodeRegistryItem } from "./nodeRegistry";
import BaseNode from "./nodes/BaseNode";
import NodeConfigPanel from "./nodes/NodeConfigPanel";

// ── 注册所有节点类型到 React Flow ──
const nodeTypes = {
  input: BaseNode,
  intent_classifier: BaseNode,
  entity_extractor: BaseNode,
  business_router: BaseNode,
  condition: BaseNode,
  business_data_query: BaseNode,
  knowledge_retrieval: BaseNode,
  tool: BaseNode,
  llm: BaseNode,
  agent: BaseNode,
  output: BaseNode,
};

interface Props {
  workflows: any[];
  selectedWorkflow: any;
  skills: any[];
  knowledgeList: any[];
  tools: any[];
  models: any[];
}

export default function StudioClient({ workflows, selectedWorkflow, skills, knowledgeList, tools, models }: Props) {
  const router = useRouter();
  const store = useWorkflowStore();
  const selectedNode = useSelectedNode();

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [nodePicker, setNodePicker] = useState<{ x: number; y: number } | null>(null);
  const [nodeSearch, setNodeSearch] = useState("");

  // ── 加载 Workflow 数据到 Store ──
  useEffect(() => {
    if (!selectedWorkflow) {
      store.setNodes([]);
      store.setEdges([]);
      store.markClean();
      return;
    }
    const nodes = selectedWorkflow.nodes || [];
    const edges = selectedWorkflow.edges || [];
    store.loadFromDB(nodes, edges);
  }, [selectedWorkflow?.id]);

  // ── 关闭菜单/选择器 ──
  useEffect(() => {
    if (contextMenu || nodePicker) {
      const close = (e: MouseEvent) => {
        const t = e.target as HTMLElement;
        if (!t.closest(".agxContextMenu") && !t.closest(".agxNodePicker")) {
          setContextMenu(null);
          setNodePicker(null);
        }
      };
      document.addEventListener("click", close);
      document.addEventListener("contextmenu", close);
      return () => {
        document.removeEventListener("click", close);
        document.removeEventListener("contextmenu", close);
      };
    }
  }, [contextMenu, nodePicker]);

  // ── 选中节点 ──
  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    store.selectNode(node.id);
    setContextMenu(null);
    setNodePicker(null);
  }, []);

  // ── 点击画布空白 ──
  const onPaneClick = useCallback(() => {
    store.selectNode(null);
    setContextMenu(null);
    setNodePicker(null);
  }, []);

  // ── 右键菜单 ──
  const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: (e as MouseEvent).clientX ?? (e as React.MouseEvent).clientX, y: (e as MouseEvent).clientY ?? (e as React.MouseEvent).clientY });
  }, []);

  // ── 添加节点 ──
  const handleAddNode = useCallback((item: NodeRegistryItem) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNode: Node<WorkflowNodeData> = {
      id,
      type: item.type.toLowerCase(),
      position: {
        x: 300 + Math.random() * 120 - 60,
        y: 200 + Math.random() * 80 - 40,
      },
      data: {
        nodeType: item.type,
        nodeName: item.label,
        description: item.desc,
        inputSchema: JSON.stringify(item.inputs),
        outputSchema: JSON.stringify(item.outputs),
        configJson: JSON.stringify(item.defaults),
        runtimeConfig: JSON.stringify(item.runtimeDefaults),
      },
    };
    store.addNode(newNode);
    store.selectNode(id);
  }, []);

  // ── 新建 Workflow ──
  const handleCreateWorkflow = async () => {
    const name = prompt("请输入新 Agent 名称:", `Agent-${new Date().toISOString().slice(0, 10)}`);
    if (!name) return;
    try {
      const res = await fetch("/api/agent-console/workflow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: "GENERAL" }),
      });
      if (!res.ok) throw new Error("创建失败");
      const data = await res.json();
      router.push(`/operator/agent-console/studio?id=${data.id}`);
    } catch (e: any) {
      alert("创建失败: " + e.message);
    }
  };

  // ── 保存草稿 ──
  const handleSave = async () => {
    if (!selectedWorkflow) {
      setSaveMessage("⚠ 请先选择或新建一个 Workflow");
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/agent-console/workflow/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          nodes: store.nodes.map((n) => ({
            dbId: n.data.dbId,
            nodeType: n.data.nodeType,
            nodeName: n.data.nodeName,
            description: n.data.description || "",
            inputSchema: n.data.inputSchema || "[]",
            outputSchema: n.data.outputSchema || "[]",
            configJson: n.data.configJson,
            runtimeConfig: n.data.runtimeConfig || "{}",
            positionX: Math.round(n.position.x),
            positionY: Math.round(n.position.y),
          })),
          edges: store.edges.map((e) => ({
            dbId: (e as any).dbId,
            sourceNodeId: e.source,
            targetNodeId: e.target,
            sourcePort: e.sourceHandle || "out",
            targetPort: e.targetHandle || "in",
            condition: e.label || "always",
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(`✓ 已保存 ${data.savedNodes} 节点 / ${data.savedEdges} 连线`);
        store.markClean();
        setTimeout(() => router.refresh(), 800);
      } else {
        setSaveMessage("✗ 保存失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      setSaveMessage("✗ 保存失败: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── 发布版本 ──
  const handlePublishVersion = async () => {
    if (!selectedWorkflow) return;
    if (!confirm("确定发布新版本？将自动生成 v 编号并保留旧版本快照")) return;
    setSaving(true);
    try {
      await fetch("/api/agent-console/workflow/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          nodes: store.nodes.map((n) => ({
            dbId: n.data.dbId,
            nodeType: n.data.nodeType,
            nodeName: n.data.nodeName,
            description: n.data.description || "",
            inputSchema: n.data.inputSchema || "[]",
            outputSchema: n.data.outputSchema || "[]",
            configJson: n.data.configJson,
            runtimeConfig: n.data.runtimeConfig || "{}",
            positionX: Math.round(n.position.x),
            positionY: Math.round(n.position.y),
          })),
          edges: store.edges.map((e) => ({
            sourceNodeId: e.source,
            targetNodeId: e.target,
            sourcePort: e.sourceHandle || "out",
            targetPort: e.targetHandle || "in",
            condition: e.label || "always",
          })),
        }),
      });
      const res = await fetch("/api/agent-console/workflow/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: selectedWorkflow.id,
          changelog: `发布 ${store.nodes.length}节点 / ${store.edges.length}连线`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(`✓ 已发布版本 v${data.version}`);
        store.markClean();
        setTimeout(() => router.refresh(), 1000);
      } else {
        setSaveMessage("✗ 发布失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      setSaveMessage("✗ 发布失败: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="agxStudio">
      {/* ── 顶部工具栏 ── */}
      <div className="agxStudioHeader">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            className="agxStudioTitleSelect"
            value={selectedWorkflow?.id || ""}
            onChange={(e) => router.push(`/operator/agent-console/studio?id=${e.target.value}`)}
          >
            {workflows.length === 0 && <option value="">暂无 Workflow</option>}
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>{w.name} (v{w.currentVersion})</option>
            ))}
          </select>
          {selectedWorkflow && (
            <div className="agxStudioSub">
              <span className={`agxStatus ${selectedWorkflow.status === "PUBLISHED" ? "ok" : selectedWorkflow.status === "TESTING" ? "warn" : "draft"}`}>
                {selectedWorkflow.status === "PUBLISHED" ? "已发布" : selectedWorkflow.status === "TESTING" ? "测试中" : selectedWorkflow.status === "OFFLINE" ? "已下线" : "草稿"}
              </span>
              <span className="agxMuted">v{selectedWorkflow.currentVersion}</span>
              <span className="agxMuted">{store.nodes.length}节点 / {store.edges.length}连线</span>
              {store.isDirty && <span className="agxMuted" style={{ color: "#f59e0b" }}>● 未保存</span>}
            </div>
          )}
        </div>
        <div className="agxStudioActions">
          <button className="agxBtn" onClick={handleCreateWorkflow}>+ 新建 Agent</button>
          {saveMessage && <span className="agxSaveMsg">{saveMessage}</span>}
          <a className="agxBtn" href={`/operator/agent-console/test?id=${selectedWorkflow?.id || ""}`}>测试运行</a>
          <button className="agxBtn" onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存草稿"}</button>
          <button className="agxBtnPrimary" onClick={handlePublishVersion} disabled={saving || !selectedWorkflow}>发布版本</button>
        </div>
      </div>

      {/* ── 主体：画布 + 配置面板 ── */}
      <div className={`agxStudioBody ${selectedNode ? "hasRightPanel" : ""}`}>
        <div className="agxRfCanvas">
          <ReactFlow
            nodes={store.nodes}
            edges={store.edges}
            onNodesChange={store.onNodesChange}
            onEdgesChange={store.onEdgesChange}
            onConnect={store.onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            multiSelectionKeyCode="Shift"
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              type: "default",
              animated: false,
              style: { stroke: "#d1d5db", strokeWidth: 1, opacity: 0.8 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls position="bottom-right" />
            <MiniMap
              position="bottom-left"
              nodeColor={(n) => getNodeStyle((n.data as WorkflowNodeData)?.nodeType || "INPUT").color}
              style={{ background: "#fafbfc" }}
            />
          </ReactFlow>

          {/* ── 右键菜单 ── */}
          {contextMenu && (
            <div
              className="agxContextMenu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="agxMenuItem"
                onClick={() => {
                  setNodePicker({ x: contextMenu.x + 180, y: contextMenu.y });
                  setContextMenu(null);
                }}
              >
                添加节点
              </div>
              <div className="agxMenuItem" onClick={() => setContextMenu(null)}>添加注释</div>
              <div className="agxMenuItem" onClick={() => setContextMenu(null)}>预览</div>
              <div className="agxMenuSeparator" />
              <div className="agxMenuItem">粘贴到这里</div>
              <div className="agxMenuSeparator" />
              <div className="agxMenuItem" onClick={() => setContextMenu(null)}>导出 DSL</div>
              <div className="agxMenuItem" onClick={() => setContextMenu(null)}>导入应用</div>
            </div>
          )}

          {/* ── 节点选择器 ── */}
          {nodePicker && (
            <div
              className="agxNodePicker"
              style={{ left: nodePicker.x, top: nodePicker.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="agxNodePickerHeader">
                <input
                  className="agxNodePickerSearch"
                  placeholder="搜索节点..."
                  value={nodeSearch}
                  onChange={(e) => setNodeSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="agxNodePickerList">
                {NODE_PALETTE.filter(
                  (p) =>
                    p.label.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                    p.type.toLowerCase().includes(nodeSearch.toLowerCase())
                ).map((p) => (
                  <div
                    key={p.type}
                    className="agxNodePickerItem"
                    onClick={() => {
                      handleAddNode(p);
                      setNodePicker(null);
                      setNodeSearch("");
                    }}
                  >
                    <div className="agxNodePickerIcon" style={{ background: p.bg, color: p.color }}>
                      {p.icon}
                    </div>
                    <div className="agxNodePickerInfo">
                      <div className="agxNodePickerLabel">{p.label}</div>
                      <div className="agxNodePickerDesc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 右侧配置面板（仅选中节点时显示） ── */}
        {selectedNode && (
          <div className="agxStudioRightPanel">
            <NodeConfigPanel
              nodeId={selectedNode.id}
              dataSources={{ skills, tools, models, knowledgeList }}
              onClose={() => store.selectNode(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
