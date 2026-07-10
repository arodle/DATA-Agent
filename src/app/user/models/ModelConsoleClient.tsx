"use client";

import { useState } from "react";

type ModelItem = {
  id: string;
  name: string;
  taskType: string;
  source: string | null;
  description: string | null;
  createdAt: Date;
  bindingCount: number;
  runCount: number;
};

type ModelRunItem = {
  id: string;
  runName: string;
  modelName: string;
  modelId: string;
  datasetName: string | null;
  status: string;
  tool: string | null;
  conclusion: string | null;
  metricsJson: Record<string, unknown> | null;
  createdAt: Date;
  recommendations: { id: string; title: string; reason: string; nextDataNeed: string | null; accepted: boolean }[];
};

const subTabs = [
  { key: "list", label: "模型列表" },
  { key: "versions", label: "模型版本" },
  { key: "metrics", label: "模型指标" },
  { key: "training", label: "训练记录" },
  { key: "relation", label: "数据关联" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  IMPORTED: { bg: "#e9fbf3", text: "#0aa866" },
  TRAINING: { bg: "#fff8e6", text: "#9b6400" },
  COMPLETED: { bg: "#edf4ff", text: "#2d65c7" },
  FAILED: { bg: "#fff0f3", text: "#c41e3a" },
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMetricValue(metrics: Record<string, unknown> | null, key: string): string {
  if (!metrics) return "-";
  const val = metrics[key];
  if (typeof val === "number") return val.toFixed(2);
  if (typeof val === "string") return val;
  return "-";
}

type Props = {
  models: ModelItem[];
  runs: ModelRunItem[];
};

export default function ModelConsoleClient({ models, runs }: Props) {
  const [subTab, setSubTab] = useState("list");

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "COMPLETED" || r.status === "IMPORTED").length;

  return (
    <>
      <header className="roleTopbar">
        <div>
          <p className="crumb">用户视角 / 模型中心</p>
          <h1>模型中心</h1>
        </div>
        <div className="topbarRight">
          <span className="statusTag">{models.length} 个模型 · {totalRuns} 次训练</span>
          <button className="primaryBtn">绑定新模型</button>
        </div>
      </header>

      <div className="modelBanner">
        <span className="modelBannerIcon">🧠</span>
        <div>
          <strong>模型管理中心</strong>
          <p>管理模型资产、跟踪训练效果、追溯数据关联，持续优化模型性能</p>
        </div>
      </div>

      <div className="subTabBar">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            className={subTab === tab.key ? "subTabItem active" : "subTabItem"}
            onClick={() => setSubTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "list" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>模型列表</h3>
            <div className="modelStats">
              <span>总模型：{models.length}</span>
              <span>训练完成：{completedRuns}</span>
            </div>
          </div>
          <div className="modelTable">
            <div className="modelRow modelHead">
              <span>模型名称</span>
              <span>任务类型</span>
              <span>来源</span>
              <span>绑定项目</span>
              <span>训练次数</span>
              <span>创建时间</span>
              <span>操作</span>
            </div>
            {models.map((model) => (
              <div className="modelRow" key={model.id}>
                <span className="modelName">{model.name}</span>
                <span><span className="versionBadge">{model.taskType}</span></span>
                <span>{model.source ?? "-"}</span>
                <span>{model.bindingCount}</span>
                <span>{model.runCount}</span>
                <span>{formatDate(model.createdAt)}</span>
                <span><button className="linkBtn">详情</button></span>
              </div>
            ))}
            {models.length === 0 && (
              <div className="modelRow empty">暂无模型</div>
            )}
          </div>
        </div>
      )}

      {subTab === "versions" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>模型版本</h3>
            <button className="outlineBtn">版本对比</button>
          </div>
          <div className="versionTree">
            {models.map((model) => {
              const modelRuns = runs.filter((r) => r.modelId === model.id);
              return (
                <div className="versionBranch" key={model.id}>
                  <div className="versionBranchHead">
                    <strong>{model.name}</strong>
                    <span>{model.taskType}</span>
                  </div>
                  <div className="versionBranchBody">
                    {modelRuns.length > 0 ? (
                      modelRuns.map((run, i) => (
                        <div className="versionNode" key={run.id}>
                          <span className="versionNodeDot" />
                          <div className="versionNodeCard">
                            <strong>v{i + 1}.0</strong>
                            <span>{run.runName}</span>
                            <span className="versionNodeDate">{formatDate(run.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="versionNodeEmpty">暂无版本记录</span>
                    )}
                  </div>
                </div>
              );
            })}
            {models.length === 0 && (
              <div className="emptyState">暂无模型版本</div>
            )}
          </div>
        </div>
      )}

      {subTab === "metrics" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>模型指标</h3>
            <select className="computeFilter">
              <option>全部模型</option>
              {models.map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="metricsGrid">
            {runs.map((run) => {
              const colors = statusColors[run.status] ?? statusColors.IMPORTED;
              return (
                <div className="metricsCard" key={run.id}>
                  <div className="metricsCardHead">
                    <strong>{run.modelName}</strong>
                    <span className="statusBadge" style={{ background: colors.bg, color: colors.text }}>
                      {run.status}
                    </span>
                  </div>
                  <div className="metricsCardBody">
                    <div className="metricItem">
                      <span>mAP@0.5</span>
                      <strong>{getMetricValue(run.metricsJson, "map50")}</strong>
                    </div>
                    <div className="metricItem">
                      <span>mAP@0.5:0.95</span>
                      <strong>{getMetricValue(run.metricsJson, "map5095")}</strong>
                    </div>
                    <div className="metricItem">
                      <span>精确率</span>
                      <strong>{getMetricValue(run.metricsJson, "precision")}</strong>
                    </div>
                    <div className="metricItem">
                      <span>召回率</span>
                      <strong>{getMetricValue(run.metricsJson, "recall")}</strong>
                    </div>
                    <div className="metricItem">
                      <span>F1 Score</span>
                      <strong>{getMetricValue(run.metricsJson, "f1")}</strong>
                    </div>
                    <div className="metricItem">
                      <span>FPS</span>
                      <strong>{getMetricValue(run.metricsJson, "fps")}</strong>
                    </div>
                  </div>
                  <div className="metricsCardFooter">
                    <span>{run.runName}</span>
                    <span>{formatDate(run.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            {runs.length === 0 && (
              <div className="emptyState">暂无指标数据</div>
            )}
          </div>
        </div>
      )}

      {subTab === "training" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>训练记录</h3>
            <button className="outlineBtn">导出记录</button>
          </div>
          <div className="trainingTable">
            <div className="trainingRow trainingHead">
              <span>训练名称</span>
              <span>模型</span>
              <span>数据集</span>
              <span>工具</span>
              <span>状态</span>
              <span>结论</span>
              <span>时间</span>
            </div>
            {runs.map((run) => {
              const colors = statusColors[run.status] ?? statusColors.IMPORTED;
              return (
                <div className="trainingRow" key={run.id}>
                  <span className="trainingName">{run.runName}</span>
                  <span>{run.modelName}</span>
                  <span>{run.datasetName ?? "-"}</span>
                  <span>{run.tool ?? "-"}</span>
                  <span>
                    <span className="statusBadge" style={{ background: colors.bg, color: colors.text }}>
                      {run.status}
                    </span>
                  </span>
                  <span className="trainingConclusion">{run.conclusion ?? "-"}</span>
                  <span>{formatDate(run.createdAt)}</span>
                </div>
              );
            })}
            {runs.length === 0 && (
              <div className="trainingRow empty">暂无训练记录</div>
            )}
          </div>
          {runs.some((r) => r.recommendations.length > 0) && (
            <div className="recommendationPanel">
              <div className="recommendationHead">
                <strong>训练建议</strong>
              </div>
              <div className="recommendationList">
                {runs.flatMap((run) =>
                  run.recommendations.map((rec) => (
                    <div className="recommendationItem" key={rec.id}>
                      <span className={rec.accepted ? "recCheck accepted" : "recCheck"}>
                        {rec.accepted ? "✓" : "○"}
                      </span>
                      <div>
                        <strong>{rec.title}</strong>
                        <span>{rec.reason}</span>
                        {rec.nextDataNeed && <em>数据需求：{rec.nextDataNeed}</em>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "relation" && (
        <div className="dataPanel">
          <div className="dataPanelHead">
            <h3>数据关联</h3>
            <span className="relationHint">模型 ←→ 数据集 ←→ 训练记录的关联关系</span>
          </div>
          <div className="relationGraph">
            {runs.map((run) => (
              <div className="relationRow" key={run.id}>
                <div className="relationNode modelNode">
                  <span className="relationNodeType">模型</span>
                  <strong>{run.modelName}</strong>
                </div>
                <div className="relationArrow">→</div>
                <div className="relationNode dataNode">
                  <span className="relationNodeType">训练数据</span>
                  <strong>{run.datasetName ?? "未关联数据集"}</strong>
                </div>
                <div className="relationArrow">→</div>
                <div className="relationNode runNode">
                  <span className="relationNodeType">训练记录</span>
                  <strong>{run.runName}</strong>
                  <span className="relationNodeMeta">{formatDate(run.createdAt)}</span>
                </div>
                <div className="relationArrow">→</div>
                <div className="relationNode resultNode">
                  <span className="relationNodeType">效果</span>
                  <strong>mAP: {getMetricValue(run.metricsJson, "map50")}</strong>
                </div>
              </div>
            ))}
            {runs.length === 0 && (
              <div className="emptyState">暂无数据关联记录</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
