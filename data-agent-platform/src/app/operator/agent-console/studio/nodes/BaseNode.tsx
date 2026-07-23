"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getNodeStyle } from "../nodeRegistry";
import type { WorkflowNodeData } from "../workflowStore";
import { useWorkflowStore } from "../workflowStore";

function BaseNode({ id, data, selected }: NodeProps) {
  const d = data as WorkflowNodeData;
  const style = getNodeStyle(d.nodeType);
  const selectNode = useWorkflowStore((s) => s.selectNode);

  const hasInput = d.nodeType !== "INPUT";
  const hasOutput = d.nodeType !== "OUTPUT";

  const [hoverOut, setHoverOut] = useState(false);

  const config = JSON.parse(d.configJson || "{}") as Record<string, any>;
  const subInfo = getSubInfo(d.nodeType, config);

  // INPUT 节点使用简化布局（类似 Dify 开始节点）
  const isStartNode = d.nodeType === "INPUT";

  return (
    <div
      className={`agxDifyCanvasNode ${selected ? "selected" : ""}`}
      onClick={() => selectNode(id)}
    >
      {/* ── 节点卡片 ── */}
      <div className={`agxDifyNodeCard ${isStartNode ? "agxDifyNodeCardStart" : ""}`}>
        {/* 开始标签（在卡片内部顶部） */}
        {isStartNode && (
          <div className="agxDifyNodeStartLabel">开始</div>
        )}
        {/* 单行内容：图标 + 名称 + 勾选 */}
        <div className="agxDifyNodeRow">
          {isStartNode ? (
            <span className="agxDifyNodeStartIcon" style={{ color: style.color }}>
              ▶
            </span>
          ) : (
            <div className="agxDifyNodeIconSmall" style={{ background: style.bg, color: style.color }}>
              {style.icon}
            </div>
          )}
          <span className="agxDifyNodeName">{d.nodeName}</span>
          <span className="agxDifyNodeCheck">✓</span>
        </div>

        {/* 子信息条（仅非 INPUT 节点） */}
        {!isStartNode && subInfo && (
          <div className="agxDifyNodeSub">
            <span className="agxDifyNodeSubText">{subInfo.text}</span>
            <span className="agxDifyNodeSubTag">{subInfo.tag}</span>
          </div>
        )}

        {/* ── 左侧输入 Handle ── */}
        {hasInput && (
          <Handle
            type="target"
            position={Position.Left}
            id="in"
            className="agxDifyHandle agxDifyHandleLeft"
          />
        )}

        {/* ── 右侧输出 Handle（Dify 风格大 + 按钮） ── */}
        {hasOutput && (
          <Handle
            type="source"
            position={Position.Right}
            id="out"
            className={`agxDifyHandle agxDifyHandleRight ${hoverOut ? "hover" : ""}`}
            onMouseEnter={() => setHoverOut(true)}
            onMouseLeave={() => setHoverOut(false)}
          >
            {hoverOut && <span className="agxDifyHandlePlus">+</span>}
          </Handle>
        )}
      </div>
    </div>
  );
}

function getSubInfo(nodeType: string, config: Record<string, any>) {
  switch (nodeType) {
    case "LLM":
      return { text: config.modelName || "deepseek-v4-flash", tag: "CHAT" };
    case "INTENT_CLASSIFIER":
      return { text: config.modelName || "deepseek-v4-flash", tag: "INTENT" };
    case "ENTITY_EXTRACTOR":
      return { text: config.modelName || "deepseek-v4-flash", tag: "ENTITY" };
    case "AGENT":
      return { text: config.skillId ? "已绑定技能" : "未绑定", tag: "AGENT" };
    case "KNOWLEDGE_RETRIEVAL":
      return { text: `检索 ${config.topK || 5} 条`, tag: "RAG" };
    case "BUSINESS_DATA_QUERY":
      return { text: config.tableName || "业务查询", tag: "QUERY" };
    case "TOOL":
      return { text: config.toolName || "工具调用", tag: "TOOL" };
    case "CONDITION":
      return { text: config.conditionField || "条件判断", tag: "IF" };
    case "BUSINESS_ROUTER":
      return { text: config.routeField || "业务路由", tag: "ROUTE" };
    case "OUTPUT":
      return { text: "返回结果", tag: "RESULT" };
    default:
      return null;
  }
}

export default memo(BaseNode);
