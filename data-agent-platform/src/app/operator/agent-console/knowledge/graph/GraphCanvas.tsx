"use client";

import { useState, useMemo, useRef } from "react";

interface KNode {
  id: string;
  title: string;
  type: string;
  callCount: number;
  embeddingStatus: string;
}

interface RNode {
  id: string;
  knowledgeId: string;
  relationType: string;
  targetType: string;
  targetId: string;
}

interface PNode {
  id: string;
  code: string;
  name: string;
}

interface QNode {
  id: string;
  type: string;
  severity: string;
}

interface DNode {
  id: string;
  name: string;
}

interface Props {
  knowledge: KNode[];
  relations: RNode[];
  projects: PNode[];
  qualityEvents: QNode[];
  datasets: DNode[];
}

export default function GraphCanvas({ knowledge, relations, projects, qualityEvents, datasets }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "knowledge" | "project" | "quality" | "dataset">("all");

  // 计算节点位置（环形布局）
  const nodes = useMemo(() => {
    const allNodes: any[] = [];
    const w = 1200;
    const h = 700;
    const cx = w / 2;
    const cy = h / 2;

    // 知识节点在中心
    knowledge.forEach((k, i) => {
      const angle = (i / knowledge.length) * Math.PI * 2;
      const r = 180;
      allNodes.push({
        id: k.id,
        kind: "knowledge",
        label: k.title.substring(0, 12),
        sublabel: k.type,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        callCount: k.callCount,
        embeddingStatus: k.embeddingStatus,
      });
    });

    // 业务对象在外围
    const businessNodes: any[] = [];
    relations.forEach((r) => {
      if (businessNodes.find((b) => b.id === r.targetId)) return;
      const project = projects.find((p) => p.id === r.targetId);
      const quality = qualityEvents.find((q) => q.id === r.targetId);
      const dataset = datasets.find((d) => d.id === r.targetId);
      let node: any = null;
      if (project) node = { id: r.targetId, kind: "project", label: project.code, sublabel: project.name.substring(0, 16) };
      else if (quality) node = { id: r.targetId, kind: "quality", label: quality.type, sublabel: quality.severity };
      else if (dataset) node = { id: r.targetId, kind: "dataset", label: dataset.name.substring(0, 12) };
      if (node) businessNodes.push(node);
    });

    businessNodes.forEach((b, i) => {
      const angle = (i / Math.max(businessNodes.length, 1)) * Math.PI * 2;
      const r = 320;
      allNodes.push({
        ...b,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    });

    return allNodes;
  }, [knowledge, projects, qualityEvents, datasets, relations]);

  const edges = useMemo(() => {
    return relations.map((r) => {
      const from = nodes.find((n) => n.id === r.knowledgeId);
      const to = nodes.find((n) => n.id === r.targetId);
      if (!from || !to) return null;
      return { ...r, from, to };
    }).filter(Boolean);
  }, [relations, nodes]);

  const visibleNodes = filter === "all" ? nodes : nodes.filter((n) => n.kind === filter);

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>知识关系图谱</h1>
        <p>知识如何产生：QualityEvent → Knowledge → Embedding → Agent</p>
      </div>

      <div className="agxGraphToolbar">
        <button className={filter === "all" ? "agxBtnPrimary" : "agxBtn"} onClick={() => setFilter("all")}>
          全部 ({nodes.length})
        </button>
        <button className={filter === "knowledge" ? "agxBtnPrimary" : "agxBtn"} onClick={() => setFilter("knowledge")}>
          知识 ({knowledge.length})
        </button>
        <button className={filter === "project" ? "agxBtnPrimary" : "agxBtn"} onClick={() => setFilter("project")}>
          项目 ({projects.length})
        </button>
        <button className={filter === "quality" ? "agxBtnPrimary" : "agxBtn"} onClick={() => setFilter("quality")}>
          质量事件 ({qualityEvents.length})
        </button>
        <button className={filter === "dataset" ? "agxBtnPrimary" : "agxBtn"} onClick={() => setFilter("dataset")}>
          数据集 ({datasets.length})
        </button>
        <div className="agxGraphLegend">
          <span className="agxLegend"><span className="agxLegendDot" style={{ background: "#a78bfa" }} />知识</span>
          <span className="agxLegend"><span className="agxLegendDot" style={{ background: "#60a5fa" }} />项目</span>
          <span className="agxLegend"><span className="agxLegendDot" style={{ background: "#f87171" }} />质量事件</span>
          <span className="agxLegend"><span className="agxLegendDot" style={{ background: "#34d399" }} />数据集</span>
        </div>
      </div>

      <div className="agxGraphCanvas" ref={canvasRef}>
        <svg className="agxGraphSvg" viewBox="0 0 1200 700">
          {/* 连线 */}
          {edges.map((e: any) => {
            const isHovered = hoveredNode === e.knowledgeId || hoveredNode === e.targetId;
            return (
              <g key={e.id}>
                <line
                  x1={e.from.x}
                  y1={e.from.y}
                  x2={e.to.x}
                  y2={e.to.y}
                  stroke={isHovered ? "#6366f1" : "#cbd5e1"}
                  strokeWidth={isHovered ? 2 : 1}
                  opacity={hoveredNode ? (isHovered ? 1 : 0.2) : 0.6}
                />
                <text
                  x={(e.from.x + e.to.x) / 2}
                  y={(e.from.y + e.to.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9aa7b5"
                >
                  {e.relationType}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 节点 */}
        {visibleNodes.map((n: any) => {
          const isHovered = hoveredNode === n.id;
          const colors: Record<string, string> = {
            knowledge: "#a78bfa",
            project: "#60a5fa",
            quality: "#f87171",
            dataset: "#34d399",
          };
          return (
            <div
              key={n.id}
              className="agxGraphNode"
              style={{
                left: n.x - 50,
                top: n.y - 24,
                borderColor: colors[n.kind],
                background: isHovered ? "#fff" : "#fafbfc",
                transform: isHovered ? "scale(1.1)" : "scale(1)",
                zIndex: isHovered ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className="agxGraphNodeTitle">{n.label}</div>
              <div className="agxGraphNodeSub">{n.sublabel}</div>
              {n.kind === "knowledge" && n.callCount > 0 && (
                <div className="agxGraphNodeBadge">调用 {n.callCount}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}