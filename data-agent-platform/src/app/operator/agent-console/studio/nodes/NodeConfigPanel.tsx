"use client";

import { useState, useCallback, useEffect } from "react";
import type { Node, Edge } from "@xyflow/react";
import { useWorkflowStore, type WorkflowNodeData } from "../workflowStore";
import {
  NODE_REGISTRY,
  getNodeStyle,
  getNodeVariables,
  type ConfigFieldDef,
  type VariableDef,
  type VariableType,
  type NodeRegistryItem,
} from "../nodeRegistry";

// ── 动态数据源映射 ──
interface DataSources {
  skills?: any[];
  tools?: any[];
  models?: any[];
  knowledgeList?: any[];
}

// ── 意图项类型 ──
export interface IntentItem {
  id: string;
  name: string;
  description: string;
  examples: string[];
  routeNodeId?: string;
}

interface Props {
  nodeId: string;
  dataSources: DataSources;
  onClose?: () => void;
}

const USER_INPUT_TYPES: { label: string; value: VariableType }[] = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Object", value: "object" },
  { label: "Array", value: "array" },
  { label: "Array[File]", value: "array<File>" },
  { label: "File", value: "File" },
];

export default function NodeConfigPanel({ nodeId, dataSources, onClose }: Props) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const updateNodeName = useWorkflowStore((s) => s.updateNodeName);
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === nodeId) as Node<WorkflowNodeData> | undefined;
  if (!node) return null;

  const reg = NODE_REGISTRY[node.data.nodeType];
  const style = getNodeStyle(node.data.nodeType);
  const vars = getNodeVariables(node.data.nodeType);
  const config = JSON.parse(node.data.configJson || "{}") as Record<string, any>;
  const runtimeConfig = JSON.parse(node.data.runtimeConfig || "{}") as Record<string, any>;

  const [activeTab, setActiveTab] = useState<"settings" | "lastRun">("settings");

  const isInputNode = node.data.nodeType === "INPUT";
  const userInputs: VariableDef[] = config.userInputs ?? reg?.defaults?.userInputs ?? [];
  const runtimeContext: { name: string; label: string; keys: string[] }[] =
    config.runtimeContext ?? reg?.defaults?.runtimeContext ?? [];

  // ── 当前节点的下游节点（下一步） ──
  const downstreamEdges: Edge[] = edges.filter((e) => e.source === nodeId);
  const downstreamNodes = downstreamEdges
    .map((e) => nodes.find((n) => n.id === e.target))
    .filter((n): n is Node<WorkflowNodeData> => Boolean(n));

  // ── 更新配置字段 ──
  const handleChange = useCallback(
    (key: string, value: any, isRuntime: boolean) => {
      if (isRuntime) {
        updateNodeData(nodeId, {
          runtimeConfig: JSON.stringify({ ...runtimeConfig, [key]: value }),
        });
      } else {
        updateNodeConfig(nodeId, { [key]: value });
      }
    },
    [nodeId, updateNodeConfig, updateNodeData, runtimeConfig]
  );

  // ── 获取运行时配置值 ──
  const getRuntimeValue = (key: string) => {
    return runtimeConfig[key] ?? reg?.runtimeDefaults?.[key] ?? "";
  };

  const grouped = groupByField(reg?.configSchema || [], "group");

  const setUserInputs = (next: VariableDef[]) => {
    updateNodeConfig(nodeId, { userInputs: next });
  };

  return (
    <div className="agxDifyPanel">
      {/* ── 头部：图标 + 名称 + 描述 + 右上角操作 ── */}
      <div className="agxDifyHeader">
        <div className="agxDifyHeaderLeft">
          <div className="agxDifyNodeIcon" style={{ background: style.bg, color: style.color }}>
            {style.icon}
          </div>
          <div className="agxDifyHeaderInfo">
            <input
              className="agxDifyNodeName"
              value={node.data.nodeName || ""}
              onChange={(e) => updateNodeName(nodeId, e.target.value)}
              placeholder="节点名称"
            />
            <input
              className="agxDifyNodeDesc"
              value={node.data.description || ""}
              onChange={(e) => updateNodeData(nodeId, { description: e.target.value })}
              placeholder="添加描述..."
            />
          </div>
        </div>
        <div className="agxDifyHeaderRight">
          <button className="agxDifyHeaderBtn" title="运行">
            <PlayIcon />
          </button>
          <button className="agxDifyHeaderBtn" title="调试">
            <BugIcon />
          </button>
          <button className="agxDifyHeaderBtn" title="更多">
            <DotsIcon />
            <span style={{ marginLeft: 2 }}>...</span>
          </button>
          <button className="agxDifyHeaderBtn" title="关闭" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* ── Tab 栏 ── */}
      <div className="agxDifyTabs">
        <button
          className={`agxDifyTab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          设置
        </button>
        <button
          className={`agxDifyTab ${activeTab === "lastRun" ? "active" : ""}`}
          onClick={() => setActiveTab("lastRun")}
        >
          上次运行
        </button>
      </div>

      {/* ── 内容区 ── */}
      {activeTab === "settings" ? (
        <div className="agxDifyContent">
          {/* ── Input Node：输入字段列表 ── */}
          {isInputNode && (
            <div className="agxDifySection">
              <div className="agxDifySectionHeader">
                <span className="agxDifySectionTitle">输入字段</span>
                <button className="agxDifyIconBtn" title="设置全局变量" onClick={() => {}}>
                  <GlobeIcon />
                </button>
              </div>
              <div className="agxDifySectionHint">设置的输入可在工作流程中使用</div>
              <div className="agxDifyInputList">
                {userInputs.map((field, i) => (
                  <div key={i} className="agxDifyInputRow">
                    <span className="agxDifyInputDot">{`{x}`}</span>
                    <span className="agxDifyInputName">userinput.{field.name}</span>
                    <span className="agxDifyInputType">{formatType(field.type)}</span>
                  </div>
                ))}
                {userInputs.length === 0 && (
                  <div className="agxDifyInputEmpty">暂无输入字段</div>
                )}
              </div>
              <UserInputFieldsEditor
                value={userInputs}
                onChange={setUserInputs}
              />
            </div>
          )}

          {/* ── Runtime Context（仅 Input Node 展示） ── */}
          {isInputNode && (
            <div className="agxDifySection">
              <div className="agxDifySectionHeader">
                <span className="agxDifySectionTitle">Runtime Context</span>
              </div>
              <div className="agxDifySectionHint">以下上下文由平台运行时自动注入</div>
              <RuntimeContextTree contexts={runtimeContext} />
            </div>
          )}

          {/* ── 通用配置字段（除 runtime 分组外） ── */}
          {Object.entries(grouped)
            .filter(([group]) => group !== "runtime")
            .map(([group, fields]) => (
              <div key={group} className="agxDifySection">
                {group && <div className="agxDifySectionTitle">{group}</div>}
                {fields.map((field) => {
                  const value = config[field.key] ?? reg?.defaults?.[field.key] ?? "";
                  return (
                    <ConfigField
                      key={field.key}
                      field={field}
                      value={value}
                      onChange={(v) => handleChange(field.key, v, false)}
                      dataSources={dataSources}
                      nodeId={nodeId}
                      reg={reg}
                    />
                  );
                })}
              </div>
            ))}

          {/* ── 运行配置（runtime 分组） ── */}
          {Object.entries(grouped)
            .filter(([group]) => group === "runtime")
            .map(([group, fields]) => (
              <div key={group} className="agxDifySection">
                <div className="agxDifySectionTitle">运行配置</div>
                {fields.map((field) => {
                  const value = getRuntimeValue(field.key);
                  return (
                    <ConfigField
                      key={field.key}
                      field={field}
                      value={value}
                      onChange={(v) => handleChange(field.key, v, true)}
                      dataSources={dataSources}
                      nodeId={nodeId}
                      reg={reg}
                    />
                  );
                })}
              </div>
            ))}

          {/* ── 变量端口（可折叠） ── */}
          <div className="agxDifySection">
            <div className="agxDifySectionTitle">输出变量</div>
            {vars.outputs.length === 0 ? (
              <div className="agxDifySectionHint">无输出变量</div>
            ) : (
              <div className="agxDifyInputList">
                {vars.outputs.map((v) => (
                  <div key={v.name} className="agxDifyInputRow">
                    <span className="agxDifyInputDot">{`{x}`}</span>
                    <span className="agxDifyInputName">{v.name}</span>
                    <span className="agxDifyInputType">{formatType(v.type)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 下一步 ── */}
          {downstreamNodes.length > 0 && (
            <div className="agxDifySection">
              <div className="agxDifyNextTitle">下一步</div>
              <div className="agxDifyNextHint">添加此工作流程中的下一个节点</div>
              <div className="agxDifyNextList">
                {downstreamNodes.map((n) => {
                  const ns = getNodeStyle(n.data.nodeType);
                  return (
                    <div key={n.id} className="agxDifyNextItem">
                      <div className="agxDifyNextNode" style={{ background: ns.bg, color: ns.color }}>
                        <span>{ns.icon}</span>
                        <span className="agxDifyNextNodeName">{n.data.nodeName}</span>
                      </div>
                      <button className="agxDifyParallelBtn">
                        <span style={{ marginRight: 4 }}>＋</span>添加并行节点
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 删除节点 ── */}
          <div className="agxDifyFooter">
            <button className="agxDifyDeleteBtn" onClick={() => removeNode(nodeId)}>
              删除节点
            </button>
          </div>
        </div>
      ) : (
        <div className="agxDifyContent">
          <LastRunPanel nodeId={nodeId} nodeType={node.data.nodeType} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
//  用户输入字段编辑器（可折叠）
// ══════════════════════════════════════════

function UserInputFieldsEditor({
  value,
  onChange,
}: {
  value: VariableDef[];
  onChange: (v: VariableDef[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VariableDef[]>(value);

  const open = () => {
    setDraft(value);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  const addField = () => {
    setDraft([...draft, { name: `input_${draft.length + 1}`, type: "string", required: false, description: "" }]);
  };
  const removeField = (i: number) => {
    setDraft(draft.filter((_, idx) => idx !== i));
  };
  const updateField = (i: number, patch: Partial<VariableDef>) => {
    setDraft(draft.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };

  if (!editing) {
    return (
      <button className="agxDifyEditBtn" onClick={open}>
        <PencilIcon />
        <span style={{ marginLeft: 4 }}>编辑输入字段</span>
      </button>
    );
  }

  return (
    <div className="agxDifyUserInputEditor">
      {draft.map((field, i) => (
        <div key={i} className="agxDifyUserInputRow">
          <input
            className="agxDifyUserInputName"
            value={field.name}
            onChange={(e) => updateField(i, { name: e.target.value })}
            placeholder="变量名"
          />
          <select
            className="agxDifyUserInputType"
            value={field.type}
            onChange={(e) => updateField(i, { type: e.target.value as VariableType })}
          >
            {USER_INPUT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="agxDifyUserInputRequired">
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => updateField(i, { required: e.target.checked })}
            />
            必填
          </label>
          <button className="agxDifyUserInputRemove" onClick={() => removeField(i)}>
            ×
          </button>
        </div>
      ))}
      <div className="agxDifyUserInputActions">
        <button className="agxDifyAddBtn" onClick={addField}>+ 新增字段</button>
        <div style={{ flex: 1 }} />
        <button className="agxDifyCancelBtn" onClick={cancel}>取消</button>
        <button className="agxDifySaveBtn" onClick={save}>保存</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  Runtime Context 树形展示
// ══════════════════════════════════════════

function RuntimeContextTree({
  contexts,
}: {
  contexts: { name: string; label: string; keys: string[] }[];
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="agxDifyRuntimeTree">
      <div className="agxDifyRuntimeRoot" onClick={() => setExpanded((v) => !v)}>
        <span className="agxDifyRuntimeToggle">{expanded ? "▼" : "▶"}</span>
        <span className="agxDifyRuntimeRootName">runtime</span>
        <span className="agxDifyRuntimeRootType">Object</span>
      </div>
      {expanded && (
        <div className="agxDifyRuntimeChildren">
          {contexts.map((ctx) => (
            <div key={ctx.name} className="agxDifyRuntimeChild">
              <span className="agxDifyRuntimeChildCheck">✓</span>
              <div className="agxDifyRuntimeChildInfo">
                <div className="agxDifyRuntimeChildLabel">{ctx.label}</div>
                <div className="agxDifyRuntimeChildKeys">runtime.{ctx.name}: {ctx.keys.join(", ")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
//  单个配置字段渲染
// ══════════════════════════════════════════

function ConfigField({
  field,
  value,
  onChange,
  dataSources,
  nodeId,
  reg,
}: {
  field: ConfigFieldDef;
  value: any;
  onChange: (v: any) => void;
  dataSources: DataSources;
  nodeId?: string;
  reg?: NodeRegistryItem;
}) {
  switch (field.type) {
    case "text":
      return (
        <div className="agxDifyField">
          <label>{field.label}</label>
          <input value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "number":
      return (
        <div className="agxDifyField">
          <label>{field.label}</label>
          <input
            type="number"
            value={value ?? ""}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );
    case "select": {
      const options = field.sourceKey ? resolveDynamicOptions(field.sourceKey, dataSources) : field.options || [];
      return (
        <div className="agxDifyField">
          <label>{field.label}</label>
          <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">-- 选择{field.label} --</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    }
    case "textarea": {
      const hasDefault = reg?.defaults?.[field.key] !== undefined;
      const isDefault = hasDefault && value === reg.defaults[field.key];
      return (
        <div className="agxDifyField">
          <div className="agxDifyFieldHeader">
            <label>{field.label}</label>
            {hasDefault && (
              <button
                className="agxDifyResetBtn"
                onClick={() => onChange(reg.defaults[field.key])}
                disabled={isDefault}
              >
                恢复默认
              </button>
            )}
          </div>
          <textarea
            rows={field.rows ?? 3}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
          {isDefault && <div className="agxDifyFieldHint">当前使用默认值</div>}
        </div>
      );
    }
    case "checkbox":
      return (
        <div className="agxDifyField agxDifyFieldRow">
          <label>{field.label}</label>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        </div>
      );
    case "slider":
      return (
        <div className="agxDifyField">
          <label>
            {field.label}
            <span className="agxDifySliderVal">{value ?? field.min ?? 0}</span>
          </label>
          <input
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 1}
            step={field.step ?? 0.1}
            value={value ?? field.min ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="agxDifySlider"
          />
        </div>
      );
    case "json":
      return (
        <JsonField label={field.label} value={value} placeholder={field.placeholder} rows={field.rows ?? 4} onChange={onChange} />
      );
    case "tag-list":
      return (
        <TagListField label={field.label} value={Array.isArray(value) ? value : []} placeholder={field.placeholder} onChange={onChange} />
      );
    case "intent-list":
      return (
        <IntentListEditor label={field.label} value={Array.isArray(value) ? value : []} onChange={onChange} nodeId={nodeId} />
      );
    default:
      return null;
  }
}

function JsonField({ label, value, placeholder, rows, onChange }: any) {
  const [text, setText] = useState(() => {
    try { return typeof value === "string" ? value : JSON.stringify(value, null, 2); }
    catch { return "{}"; }
  });
  const [error, setError] = useState(false);
  return (
    <div className="agxDifyField">
      <label>{label}</label>
      <textarea
        rows={rows}
        value={text}
        placeholder={placeholder}
        className={error ? "agxDifyJsonError" : ""}
        onChange={(e) => {
          setText(e.target.value);
          try { onChange(JSON.parse(e.target.value)); setError(false); }
          catch { setError(true); }
        }}
      />
      {error && <div className="agxDifyFieldError">JSON 格式错误</div>}
    </div>
  );
}

function TagListField({ label, value, placeholder, onChange }: any) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const t = input.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };
  return (
    <div className="agxDifyField">
      <label>{label}</label>
      <div className="agxDifyTagList">
        {value.map((tag: string) => (
          <span key={tag} className="agxDifyTag">
            {tag}
            <button className="agxDifyTagRemove" onClick={() => onChange(value.filter((v: string) => v !== tag))}>×</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        onBlur={addTag}
      />
    </div>
  );
}

// ══════════════════════════════════════════
//  上次运行面板
// ══════════════════════════════════════════

interface LastRunResult {
  input: string;
  prompt: string;
  modelResponse: string;
  intent: { id: string; name: string; confidence: number; reason: string };
  confidence: number;
  candidates: Array<{ id: string; confidence: number }>;
  reason: string;
  durationMs: number;
  tokens: { prompt: number; completion: number; total: number };
  model: string;
  timestamp: string;
}

function LastRunPanel({ nodeId, nodeType }: { nodeId: string; nodeType: string }) {
  const [data, setData] = useState<LastRunResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent-console/workflow/trace?nodeId=${nodeId}`);
      const result = await res.json();
      if (result && result.input) {
        setData(result);
      } else {
        setData(getMockData());
      }
    } catch {
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): LastRunResult => ({
    input: "供应商A的通过率是多少？",
    prompt: `你是一个专业的意图分类器。请根据用户问题判断意图。

可用意图：
- platform_query: 平台操作相关问题
- quality_query: 质量诊断相关问题
- project_query: 项目查询相关问题
- task_query: 任务查询相关问题
- rule_query: 规则查询相关问题
- faq_query: 常见问题
- supplier_query: 供应商查询相关问题
- tool_query: 工具查询相关问题

请返回JSON格式：{"intent":{"id":"xxx","name":"xxx","confidence":0.95,"reason":"xxx"},"candidates":[{"id":"xxx","confidence":0.8}]}`,
    modelResponse: `{"intent":{"id":"supplier_query","name":"供应商查询","confidence":0.92,"reason":"用户询问供应商通过率，属于供应商查询范畴"},"candidates":[{"id":"quality_query","confidence":0.78},{"id":"project_query","confidence":0.45}]}`,
    intent: { id: "supplier_query", name: "供应商查询", confidence: 0.92, reason: "用户询问供应商通过率，属于供应商查询范畴" },
    confidence: 0.92,
    candidates: [
      { id: "quality_query", confidence: 0.78 },
      { id: "project_query", confidence: 0.45 },
      { id: "task_query", confidence: 0.32 },
    ],
    reason: "用户询问供应商通过率，属于供应商查询范畴",
    durationMs: 856,
    tokens: { prompt: 384, completion: 96, total: 480 },
    model: "deepseek-v4-flash",
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    loadData();
  }, [nodeId]);

  if (loading) {
    return (
      <div className="agxDifyEmpty">
        <div className="agxDifyEmptyIcon">⏳</div>
        <div className="agxDifyEmptyText">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="agxDifyEmpty">
        <div className="agxDifyEmptyIcon">📋</div>
        <div className="agxDifyEmptyText">暂无运行记录</div>
        <div className="agxDifyEmptyHint">点击右上角的运行按钮开始测试</div>
      </div>
    );
  }

  const confidenceClass = data.intent.confidence >= 0.8 ? "high" : data.intent.confidence >= 0.5 ? "medium" : "low";

  return (
    <div className="agxDifyLastRun">
      <div className="agxDifyLastRunHeader">
        <span className="agxDifyLastRunTime">{new Date(data.timestamp).toLocaleString()}</span>
        <span className="agxDifyLastRunModel">{data.model}</span>
      </div>

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">用户输入</div>
        <div className="agxDifyLastRunValue">{data.input}</div>
      </div>

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">Prompt</div>
        <textarea className="agxDifyLastRunCode" readOnly value={data.prompt} rows={8} />
      </div>

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">模型返回</div>
        <textarea className="agxDifyLastRunCode" readOnly value={data.modelResponse} rows={6} />
      </div>

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">识别结果</div>
        <div className="agxDifyIntentResult">
          <div className="agxDifyIntentResultHeader">
            <span className="agxDifyIntentResultName">{data.intent.name}</span>
            <span className="agxDifyIntentResultId">{data.intent.id}</span>
          </div>
          <div className="agxDifyIntentResultConfidence">
            <span className="agxDifyIntentResultConfidenceLabel">置信度</span>
            <span className={`agxDifyIntentResultConfidenceValue ${confidenceClass}`}>
              {data.intent.confidence.toFixed(2)}
            </span>
          </div>
          <div className="agxDifyIntentResultReason">
            <span className="agxDifyIntentResultReasonLabel">理由</span>
            <span className="agxDifyIntentResultReasonText">{data.intent.reason}</span>
          </div>
        </div>
      </div>

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">置信度</div>
        <div className="agxDifyLastRunValue">
          <div className="agxDifyConfidenceBar">
            <div
              className={`agxDifyConfidenceBarFill ${confidenceClass}`}
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
          <span className={`agxDifyConfidenceText ${confidenceClass}`}>{data.confidence.toFixed(2)}</span>
        </div>
      </div>

      {data.candidates && data.candidates.length > 0 && (
        <div className="agxDifyLastRunSection">
          <div className="agxDifyLastRunTitle">候选意图</div>
          <div className="agxDifyIntentCandidates">
            {data.candidates.map((c, i) => (
              <div key={i} className="agxDifyIntentCandidate">
                <span className="agxDifyIntentCandidateId">{c.id}</span>
                <div className="agxDifyIntentCandidateBar">
                  <div
                    className="agxDifyIntentCandidateBarFill"
                    style={{ width: `${c.confidence * 100}%` }}
                  />
                </div>
                <span className="agxDifyIntentCandidateConfidence">{c.confidence.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">理由</div>
        <div className="agxDifyLastRunValue">{data.reason}</div>
      </div>

      <div className="agxDifyLastRunMeta">
        <div className="agxDifyLastRunMetaItem">
          <span className="agxDifyLastRunMetaLabel">耗时</span>
          <span className="agxDifyLastRunMetaValue">{data.durationMs}ms</span>
        </div>
        <div className="agxDifyLastRunMetaItem">
          <span className="agxDifyLastRunMetaLabel">总Token</span>
          <span className="agxDifyLastRunMetaValue">{data.tokens.total}</span>
        </div>
        <div className="agxDifyLastRunMetaItem">
          <span className="agxDifyLastRunMetaLabel">Prompt</span>
          <span className="agxDifyLastRunMetaValue">{data.tokens.prompt}</span>
        </div>
        <div className="agxDifyLastRunMetaItem">
          <span className="agxDifyLastRunMetaLabel">Completion</span>
          <span className="agxDifyLastRunMetaValue">{data.tokens.completion}</span>
        </div>
      </div>

      <div className="agxDifyLastRunSection">
        <div className="agxDifyLastRunTitle">最终输出 JSON</div>
        <textarea className="agxDifyLastRunCode" readOnly value={JSON.stringify(data, null, 2)} rows={10} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  意图列表编辑器（支持动态添加/删除/排序）
// ══════════════════════════════════════════

function IntentListEditor({ label, value, onChange, nodeId }: { label: string; value: IntentItem[]; onChange: (v: IntentItem[]) => void; nodeId?: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const nodes = useWorkflowStore((s) => s.nodes);

  const downstreamNodes = nodeId
    ? nodes.filter((n) => n.id !== nodeId && n.data.nodeType !== "OUTPUT")
    : [];

  const addIntent = () => {
    const newId = `intent_${Date.now()}`;
    onChange([...value, { id: newId, name: "", description: "", examples: [], routeNodeId: "" }]);
    setEditingId(newId);
  };

  const removeIntent = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const updateIntent = (i: number, patch: Partial<IntentItem>) => {
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const moveIntent = (from: number, to: number) => {
    const next = [...value];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next);
  };

  const addExample = (i: number) => {
    const item = value[i];
    if (item) {
      updateIntent(i, { examples: [...item.examples, ""] });
    }
  };

  const removeExample = (i: number, idx: number) => {
    const item = value[i];
    if (item) {
      updateIntent(i, { examples: item.examples.filter((_, eIdx) => eIdx !== idx) });
    }
  };

  const updateExample = (i: number, idx: number, text: string) => {
    const item = value[i];
    if (item) {
      const next = [...item.examples];
      next[idx] = text;
      updateIntent(i, { examples: next });
    }
  };

  return (
    <div className="agxDifyField">
      <label>{label}</label>
      <div className="agxDifyIntentList">
        {value.map((item, i) => (
          <div
            key={item.id}
            className={`agxDifyIntentItem ${editingId === item.id ? "editing" : ""} ${draggingIdx === i ? "dragging" : ""}`}
            draggable
            onDragStart={() => setDraggingIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggingIdx !== null && draggingIdx !== i) {
                moveIntent(draggingIdx, i);
              }
              setDraggingIdx(null);
            }}
          >
            {/* 拖拽手柄 */}
            <div className="agxDifyIntentDrag">⋮⋮</div>

            {/* 内容区 */}
            <div className="agxDifyIntentContent">
              {editingId === item.id ? (
                <div className="agxDifyIntentForm">
                  <div className="agxDifyIntentRow">
                    <input
                      className="agxDifyIntentId"
                      value={item.id}
                      onChange={(e) => updateIntent(i, { id: e.target.value })}
                      placeholder="Intent ID"
                    />
                    <input
                      className="agxDifyIntentName"
                      value={item.name}
                      onChange={(e) => updateIntent(i, { name: e.target.value })}
                      placeholder="显示名称"
                    />
                  </div>
                  <textarea
                    className="agxDifyIntentDesc"
                    value={item.description}
                    onChange={(e) => updateIntent(i, { description: e.target.value })}
                    placeholder="描述"
                    rows={2}
                  />
                  <div className="agxDifyIntentExamples">
                    <div className="agxDifyIntentExamplesTitle">示例问题</div>
                    {item.examples.map((ex, idx) => (
                      <div key={idx} className="agxDifyIntentExampleRow">
                        <input
                          value={ex}
                          onChange={(e) => updateExample(i, idx, e.target.value)}
                          placeholder={`示例 ${idx + 1}`}
                        />
                        <button className="agxDifyIntentExampleRemove" onClick={() => removeExample(i, idx)}>×</button>
                      </div>
                    ))}
                    <button className="agxDifyIntentAddExample" onClick={() => addExample(i)}>+ 添加示例</button>
                  </div>
                  <div className="agxDifyIntentRoute">
                    <label>默认路由（可选）</label>
                    <select
                      value={item.routeNodeId || ""}
                      onChange={(e) => updateIntent(i, { routeNodeId: e.target.value || undefined })}
                    >
                      <option value="">-- 选择下游节点 --</option>
                      {downstreamNodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.data.nodeName || n.data.nodeType}</option>
                      ))}
                    </select>
                  </div>
                  <div className="agxDifyIntentActions">
                    <button className="agxDifyIntentSave" onClick={() => setEditingId(null)}>保存</button>
                    <button className="agxDifyIntentCancel" onClick={() => setEditingId(null)}>取消</button>
                  </div>
                </div>
              ) : (
                <div className="agxDifyIntentSummary">
                  <div className="agxDifyIntentHeader">
                    <span className="agxDifyIntentName">{item.name || "未命名意图"}</span>
                    <span className="agxDifyIntentId">{item.id}</span>
                  </div>
                  {item.description && (
                    <div className="agxDifyIntentDesc">{item.description}</div>
                  )}
                  {item.examples.length > 0 && (
                    <div className="agxDifyIntentExamples">
                      {item.examples.slice(0, 3).map((ex, idx) => (
                        <div key={idx} className="agxDifyIntentExample">{ex}</div>
                      ))}
                      {item.examples.length > 3 && (
                        <div className="agxDifyIntentMore">+{item.examples.length - 3} 更多</div>
                      )}
                    </div>
                  )}
                  {item.routeNodeId && (
                    <div className="agxDifyIntentRouteInfo">
                      <span className="agxDifyIntentRouteLabel">路由:</span>
                      <span className="agxDifyIntentRouteValue">
                        {downstreamNodes.find((n) => n.id === item.routeNodeId)?.data.nodeName || item.routeNodeId}
                      </span>
                    </div>
                  )}
                  <div className="agxDifyIntentFooter">
                    <button className="agxDifyIntentEdit" onClick={() => setEditingId(item.id)}>编辑</button>
                    <button className="agxDifyIntentDelete" onClick={() => removeIntent(i)}>删除</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="agxDifyAddBtn" onClick={addIntent}>+ 新增意图</button>
    </div>
  );
}

// ══════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════

function groupByField<T extends { group?: string }>(items: T[], key: keyof T): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const g = (item[key] as string) || "";
    if (!result[g]) result[g] = [];
    result[g].push(item);
  }
  return result;
}

function resolveDynamicOptions(sourceKey: string, dataSources: DataSources): { label: string; value: string }[] {
  const data = dataSources[sourceKey as keyof DataSources];
  if (!data || !Array.isArray(data)) return [];
  switch (sourceKey) {
    case "skills":
      return data.map((s: any) => ({ label: `${s.name} (${s.category || ""})`, value: s.id }));
    case "tools":
      return data.map((t: any) => ({ label: `${t.name} (${t.toolType || ""})`, value: t.id }));
    case "models":
      return data.length > 0
        ? data.map((m: any) => ({ label: `${m.name} (${m.taskType || ""})`, value: m.name }))
        : [{ label: "deepseek-chat", value: "deepseek-chat" }, { label: "deepseek-reasoner", value: "deepseek-reasoner" }];
    case "knowledgeList":
      return data.map((k: any) => ({ label: k.title, value: k.id }));
    default:
      return [];
  }
}

function formatType(t: VariableType): string {
  if (t === "array<File>") return "Array[File]";
  if (t === "array") return "Array";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ══════════════════════════════════════════
//  Icons
// ══════════════════════════════════════════

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 3l9 5-9 5V3z" fill="currentColor" />
    </svg>
  );
}
function BugIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="9" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5V3M5 9H3M13 9h-2M5.5 5.5L4 4M10.5 5.5L12 4M5.5 12.5L4 14M10.5 12.5L12 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="8" r="1.2" />
      <circle cx="8" cy="8" r="1.2" />
      <circle cx="13" cy="8" r="1.2" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
