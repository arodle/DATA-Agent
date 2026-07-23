"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Source {
  type: string;
  id: string;
  title: string;
  preview: string;
  meta: string;
  time: string;
}

interface Candidate {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string | null;
  status: string;
  sourceType: string | null;
  sourceId: string | null;
  confidence: number;
  tags: string | null;
}

interface Props {
  sources: Source[];
  projects: { id: string; code: string; name: string }[];
  tasks: { id: string; name: string }[];
  qualityEvents: { id: string; type: string; projectCode?: string }[];
  candidates: Candidate[];
}

export default function KnowledgeEditor({ sources, projects, tasks, qualityEvents, candidates }: Props) {
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState<Source | null>(sources[0] || null);
  const [activeTab, setActiveTab] = useState<"create" | "candidates">("candidates");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(candidates[0] || null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("标注规则");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [confidence, setConfidence] = useState(80);
  const [relations, setRelations] = useState<{ type: string; targetId: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSelectCandidate = (c: Candidate) => {
    setSelectedCandidate(c);
    setTitle(c.title);
    setContent(c.content);
    setType(c.type);
    setCategory(c.category || "");
    setTags(c.tags || "");
    setConfidence(c.confidence);
  };

  const handleSelectSource = (s: Source) => {
    setSelectedSource(s);
    // AI 自动提取：模拟根据来源生成候选知识
    setTitle(`从${s.type}提炼：${s.title}`);
    setContent(`【提炼内容】\n\n来源：${s.type}\n原始信息：${s.preview}\n\n【建议适用】\n建议在相关项目中参考此经验。`);
  };

  const handlePublish = async () => {
    if (!title || !content) {
      alert("请填写标题和内容");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/agent-console/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          type,
          category,
          tags,
          confidence,
          status: "PUBLISHED",
          sourceType: selectedSource?.type,
          sourceId: selectedSource?.id,
          relations,
        }),
      });
      if (res.ok) {
        alert("已发布到知识库！");
        router.refresh();
      } else {
        alert("发布失败");
      }
    });
  };

  const handleSaveDraft = async () => {
    startTransition(async () => {
      await fetch("/api/agent-console/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "未命名草稿",
          content,
          type,
          category,
          tags,
          confidence,
          status: "DRAFT",
          sourceType: selectedSource?.type,
          sourceId: selectedSource?.id,
        }),
      });
      alert("已保存草稿");
      router.refresh();
    });
  };

  const addRelation = (targetType: string, targetId: string) => {
    setRelations((prev) => [...prev, { type: targetType, targetId }]);
  };

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>知识运营中心</h1>
        <p>从业务事件中提炼知识 → 人工编辑 → 关联业务对象 → 发布到知识库</p>
      </div>

      <div className="agxTabs">
        <button className={activeTab === "candidates" ? "agxTab active" : "agxTab"} onClick={() => setActiveTab("candidates")}>
          候选知识 ({candidates.length})
        </button>
        <button className={activeTab === "create" ? "agxTab active" : "agxTab"} onClick={() => setActiveTab("create")}>
          新建知识
        </button>
      </div>

      <div className="agxOperationLayout">
        {/* 左侧：知识来源 */}
        <div className="agxCard">
          <div className="agxCardHeader">
            <h3>知识来源</h3>
            <span className="agxCardSub">{sources.length} 条原始数据</span>
          </div>
          <div className="agxSourceList">
            {sources.map((s) => (
              <div
                key={`${s.type}-${s.id}`}
                className={selectedSource?.id === s.id ? "agxSourceItem active" : "agxSourceItem"}
                onClick={() => handleSelectSource(s)}
              >
                <div className="agxSourceHeader">
                  <span className="agxSourceType">{s.type}</span>
                  <span className="agxSourceTime">{s.time}</span>
                </div>
                <div className="agxSourceTitle">{s.title}</div>
                <div className="agxSourcePreview">{s.preview}</div>
                <div className="agxSourceMeta">📎 {s.meta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 中间：知识编辑 */}
        <div className="agxCard">
          <div className="agxCardHeader">
            <h3>{activeTab === "candidates" ? "候选知识编辑" : "新建知识"}</h3>
            {activeTab === "candidates" && candidates.length > 0 && (
              <select
                className="agxSelect"
                onChange={(e) => {
                  const c = candidates.find((x) => x.id === e.target.value);
                  if (c) handleSelectCandidate(c);
                }}
                value={selectedCandidate?.id}
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="agxEditorBody">
            <div className="agxField">
              <label>知识标题 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入知识标题..." />
            </div>
            <div className="agxFieldRow">
              <div className="agxField">
                <label>类型 *</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>标注规则</option>
                  <option>质量案例</option>
                  <option>项目经验</option>
                  <option>SOP流程</option>
                  <option>数据经验</option>
                </select>
              </div>
              <div className="agxField">
                <label>分类</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="如：人体姿态" />
              </div>
              <div className="agxField">
                <label>可信度</label>
                <input type="number" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} min={0} max={100} />
              </div>
            </div>
            <div className="agxField">
              <label>知识内容 *</label>
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="详细描述知识内容、适用场景、最佳实践..."
              />
            </div>
            <div className="agxField">
              <label>标签（逗号分隔）</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：人体姿态, 关节点, 遮挡" />
            </div>

            {/* 业务关联 */}
            <div className="agxField">
              <label>业务关联（点击下方按钮添加）</label>
              <div className="agxRelationList">
                {relations.map((r, i) => (
                  <span key={i} className="agxRelationTag">
                    {r.type} → {r.targetId}
                    <button onClick={() => setRelations(relations.filter((_, j) => j !== i))}>✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="agxEditorActions">
              <button className="agxBtn" onClick={handleSaveDraft} disabled={isPending}>
                保存草稿
              </button>
              <button className="agxBtnPrimary" onClick={handlePublish} disabled={isPending}>
                {isPending ? "发布中..." : "发布到知识库"}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：业务关联面板 */}
        <div className="agxCard">
          <div className="agxCardHeader">
            <h3>添加业务关联</h3>
          </div>
          <div className="agxRelationPanel">
            <div className="agxRelationGroup">
              <div className="agxRelationGroupTitle">关联项目</div>
              <div className="agxRelationList">
                {projects.slice(0, 8).map((p) => (
                  <button key={p.id} className="agxRelationBtn" onClick={() => addRelation("APPLY_TO", p.id)}>
                    + {p.code} {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="agxRelationGroup">
              <div className="agxRelationGroupTitle">关联任务</div>
              <div className="agxRelationList">
                {tasks.slice(0, 6).map((t) => (
                  <button key={t.id} className="agxRelationBtn" onClick={() => addRelation("RELATED_TO", t.id)}>
                    + {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="agxRelationGroup">
              <div className="agxRelationGroupTitle">关联质量事件</div>
              <div className="agxRelationList">
                {qualityEvents.slice(0, 6).map((q) => (
                  <button key={q.id} className="agxRelationBtn" onClick={() => addRelation("SOURCE_FROM", q.id)}>
                    + {q.type} {q.projectCode ? `(${q.projectCode})` : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}