"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Workflow {
  id: string;
  name: string;
  status: string;
  version: string;
  currentVersion: string;
  description: string | null;
  category: string | null;
  _count: { nodes: number; edges: number; versions: number };
  nodes: Array<{ id: string; nodeType: string; nodeName: string; positionX: number; positionY: number; configJson: string | null }>;
}

interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string | null;
  passed: boolean | null;
  score: number | null;
  category: string | null;
}

interface Trace {
  id: string;
  question: string;
  status: string;
  totalTokens: number;
  durationMs: number;
  startedAt: string;
  version: string | null;
  nodeSteps: Array<{
    id: string;
    nodeType: string;
    nodeName: string;
    stepOrder: number;
    inputJson: string | null;
    outputJson: string | null;
    tokens: number;
    durationMs: number;
    status: string;
    errorMessage: string | null;
  }>;
}

const NODE_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  INPUT: { icon: "▸", label: "输入", color: "#5b8def" },
  AGENT: { icon: "◈", label: "Agent", color: "#a06bff" },
  DATA: { icon: "▤", label: "数据", color: "#00b894" },
  KNOWLEDGE: { icon: "▦", label: "知识", color: "#f59e0b" },
  TOOL: { icon: "⚙", label: "工具", color: "#ef6b6b" },
  LLM: { icon: "✧", label: "LLM", color: "#ec4899" },
  CONDITION: { icon: "◇", label: "条件", color: "#94a3b8" },
  OUTPUT: { icon: "◀", label: "输出", color: "#10b981" },
};

export default function TestRunner({ workflows, selectedWorkflowId, testCases, recentTraces }: {
  workflows: Workflow[]; selectedWorkflowId: string | undefined; testCases: TestCase[]; recentTraces: Trace[];
}) {
  const router = useRouter();
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    workflows.find((w) => w.id === selectedWorkflowId) || workflows[0] || null
  );
  const [testInput, setTestInput] = useState("");
  const [running, setRunning] = useState(false);
  const [currentTrace, setCurrentTrace] = useState<Trace | null>(null);
  const [viewingTrace, setViewingTrace] = useState<Trace | null>(null);
  const [versionChangelog, setVersionChangelog] = useState("");

  useEffect(() => {
    if (selectedWorkflowId) {
      const wf = workflows.find((w) => w.id === selectedWorkflowId);
      if (wf) setSelectedWorkflow(wf);
    }
  }, [selectedWorkflowId, workflows]);

  const handleSelectWorkflow = (wf: Workflow) => {
    setSelectedWorkflow(wf);
    setCurrentTrace(null);
    setViewingTrace(null);
    router.push(`/operator/agent-console/test?id=${wf.id}`);
  };

  const handleRun = async () => {
    if (!testInput.trim() || !selectedWorkflow) return;
    setRunning(true);
    setCurrentTrace(null);

    try {
      const res = await fetch("/api/agent-console/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: selectedWorkflow.id, question: testInput }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentTrace(data.trace);
      } else {
        alert("运行失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      alert("运行失败: " + (err as Error).message);
    } finally {
      setRunning(false);
      // 刷新以显示新的历史 trace
      setTimeout(() => router.refresh(), 1000);
    }
  };

  const handlePublishVersion = async () => {
    if (!selectedWorkflow) return;
    if (!confirm("确定发布新版本？将自动生成版本号")) return;
    try {
      const res = await fetch("/api/agent-console/workflow/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: selectedWorkflow.id, changelog: versionChangelog || "测试通过" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✓ 已发布 v${data.version}`);
        router.refresh();
      } else {
        alert("发布失败: " + (data.error || "未知"));
      }
    } catch (err) {
      alert("发布失败: " + (err as Error).message);
    }
  };

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>Agent 测试与发布</h1>
        <p>执行真实 Workflow Runtime，记录完整执行链路到数据库</p>
      </div>

      <div className="agxRow agxTestLayout">
        {/* 左：Workflow 列表 */}
        <div className="agxCard" style={{ minWidth: 280, flex: "0 0 280px" }}>
          <div className="agxCardHeader">
            <h3>Workflow 列表</h3>
            <span className="agxCardSub">{workflows.length} 个</span>
          </div>
          <div className="agxWfList">
            {workflows.length === 0 ? (
              <div className="agxEmpty">还没有 Workflow</div>
            ) : workflows.map((w) => (
              <div
                key={w.id}
                className={selectedWorkflow?.id === w.id ? "agxWfItem active" : "agxWfItem"}
                onClick={() => handleSelectWorkflow(w)}
              >
                <div className="agxWfName">{w.name}</div>
                <div className="agxWfMeta">
                  <span className={`agxStatus ${w.status === "PUBLISHED" ? "ok" : w.status === "TESTING" ? "warn" : "draft"}`}>
                    {w.status === "PUBLISHED" ? "已发布" : w.status === "TESTING" ? "测试中" : "草稿"}
                  </span>
                  <span className="agxMuted">v{w.currentVersion}</span>
                  <span className="agxMuted">{w._count.nodes}节点</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中：测试窗口 + 执行链 + 发布 */}
        <div className="agxTestMain">
          <div className="agxCard">
            <div className="agxCardHeader">
              <h3>测试窗口</h3>
              {selectedWorkflow && (
                <span className="agxCardSub">当前：{selectedWorkflow.name} v{selectedWorkflow.currentVersion} · {selectedWorkflow._count.nodes}节点 / {selectedWorkflow._count.edges}连线 / {selectedWorkflow._count.versions}历史版本</span>
              )}
            </div>
            <div className="agxCardBody">
              {selectedWorkflow && selectedWorkflow.nodes && selectedWorkflow.nodes.length > 0 && (
                <div className="agxField">
                  <label>Workflow 节点流水线（{selectedWorkflow.nodes.length} 步）</label>
                  <div className="agxNodePipeline">
                    {[...selectedWorkflow.nodes].sort((a, b) => a.positionX - b.positionX).map((n, i) => {
                      const meta = NODE_TYPE_META[n.nodeType] || { icon: "○", label: n.nodeType, color: "#94a3b8" };
                      return (
                        <div key={n.id} className="agxNodePipeItem" style={{ borderColor: meta.color }}>
                          <div className="agxNodePipeIdx">{i + 1}</div>
                          <div className="agxNodePipeIcon" style={{ background: meta.color }}>{meta.icon}</div>
                          <div className="agxNodePipeName">{n.nodeName}</div>
                          <div className="agxNodePipeType">{meta.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="agxField">
                <label>输入问题</label>
                <textarea rows={3} value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="例如：我需要标注5万条语音转写数据" />
              </div>
              <button className="agxBtnPrimary" onClick={handleRun} disabled={running || !selectedWorkflow}>
                {running ? "执行中..." : "▶ 运行测试（写入Trace）"}
              </button>
            </div>
          </div>

          {/* 当前运行的执行链 */}
          {currentTrace && (
            <div className="agxCard">
              <div className="agxCardHeader">
                <h3>本次执行链（已保存到数据库）</h3>
                <span className={`agxStatus ${currentTrace.status === "SUCCESS" ? "ok" : currentTrace.status === "FAILED" ? "err" : "warn"}`}>
                  {currentTrace.status}
                </span>
              </div>
              <div className="agxTraceMeta">
                <span>问题：{currentTrace.question}</span>
                <span>总Token：{currentTrace.totalTokens.toLocaleString()}</span>
                <span>耗时：{(currentTrace.durationMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="agxTrace">
                {currentTrace.nodeSteps.map((s) => {
                  const meta = NODE_TYPE_META[s.nodeType] || { icon: "○", label: s.nodeType, color: "#94a3b8" };
                  let input: any = {}, output: any = {};
                  try { input = JSON.parse(s.inputJson || "{}"); } catch {}
                  try { output = JSON.parse(s.outputJson || "{}"); } catch {}
                  return (
                    <div key={s.id} className="agxTraceItem">
                      <div className="agxTraceOrder">{s.stepOrder}</div>
                      <div className="agxTraceIcon" style={{ background: meta.color }}>{meta.icon}</div>
                      <div className="agxTraceContent">
                        <div className="agxTraceStep">
                          <span>{s.nodeName}</span>
                          <span className="agxTraceType" style={{ background: meta.color }}>{meta.label}</span>
                          <span className={`agxStatus ${s.status === "SUCCESS" ? "ok" : s.status === "FAILED" ? "err" : "warn"}`}>{s.status}</span>
                        </div>
                        <div className="agxTraceDetail">
                          <div><strong>输入：</strong><code>{JSON.stringify(input)}</code></div>
                          <div><strong>输出：</strong><code>{JSON.stringify(output)}</code></div>
                          {s.errorMessage && <div className="agxTraceError">✗ {s.errorMessage}</div>}
                        </div>
                      </div>
                      <div className="agxTraceTime">{s.durationMs}ms · {s.tokens}t</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 发布操作 */}
          {selectedWorkflow && (
            <div className="agxCard">
              <div className="agxCardHeader"><h3>发布版本</h3></div>
              <div className="agxPublishActions">
                <div className="agxField" style={{ flex: 1 }}>
                  <label>本次发布说明</label>
                  <input value={versionChangelog} onChange={(e) => setVersionChangelog(e.target.value)} placeholder="例如：优化Prompt与TopK参数" />
                </div>
                <button className="agxBtnPrimary" onClick={handlePublishVersion}>发布新版本</button>
                <div className="agxMuted">当前 v{selectedWorkflow.currentVersion}，发布后自动 +1</div>
              </div>
            </div>
          )}
        </div>

        {/* 右：测试用例 + 历史 Trace */}
        <div className="agxCard" style={{ minWidth: 320, flex: "0 0 320px" }}>
          <div className="agxCardHeader"><h3>历史执行 ({recentTraces.length})</h3></div>
          <div className="agxTestList">
            {recentTraces.length === 0 ? (
              <div className="agxEmpty">暂无历史执行</div>
            ) : recentTraces.map((t) => (
              <div key={t.id} className="agxTestItem" onClick={() => setViewingTrace(t)} style={{ cursor: "pointer" }}>
                <div className="agxTestHeader">
                  <span className="agxTestName">{t.question.length > 20 ? t.question.substring(0, 20) + "..." : t.question}</span>
                  <span className={`agxStatus ${t.status === "SUCCESS" ? "ok" : t.status === "FAILED" ? "err" : "warn"}`}>
                    {t.status === "SUCCESS" ? "成功" : t.status === "FAILED" ? "失败" : "部分"}
                  </span>
                </div>
                <div className="agxTestInput">{t.nodeSteps.length} 节点 · {t.totalTokens}t · {(t.durationMs / 1000).toFixed(1)}s</div>
                <div className="agxMuted">{new Date(t.startedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ))}
          </div>

          {viewingTrace && (
            <div className="agxTestList" style={{ borderTop: "1px solid #eee", marginTop: 12, paddingTop: 12 }}>
              <div className="agxMuted" style={{ marginBottom: 8 }}>查看：{viewingTrace.question}</div>
              {viewingTrace.nodeSteps.map((s) => {
                const meta = NODE_TYPE_META[s.nodeType] || { icon: "○", label: s.nodeType, color: "#94a3b8" };
                let output: any = {};
                try { output = JSON.parse(s.outputJson || "{}"); } catch {}
                return (
                  <div key={s.id} className="agxTraceItem" style={{ padding: 8 }}>
                    <div className="agxTraceIcon" style={{ background: meta.color, width: 22, height: 22, fontSize: 12 }}>{meta.icon}</div>
                    <div className="agxTraceContent">
                      <div className="agxTraceStep" style={{ fontSize: 12 }}>{s.nodeName} <span className="agxMuted">{s.durationMs}ms</span></div>
                      <div className="agxTraceDetail" style={{ fontSize: 11 }}><code>{JSON.stringify(output).substring(0, 60)}</code></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="agxCardHeader" style={{ marginTop: 16 }}><h3>测试用例 ({testCases.length})</h3></div>
          <div className="agxTestList">
            {testCases.length === 0 ? (
              <div className="agxEmpty">暂无测试用例</div>
            ) : testCases.map((t) => (
              <div key={t.id} className="agxTestItem">
                <div className="agxTestHeader">
                  <span className="agxTestName">{t.name}</span>
                  {t.passed === true && <span className="agxStatus ok">✓</span>}
                  {t.passed === false && <span className="agxStatus bad">✗</span>}
                </div>
                <div className="agxTestInput">{t.input}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
