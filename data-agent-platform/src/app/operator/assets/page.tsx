"use client";

import { useState } from "react";
import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

type AssetTab = "datasets" | "dataVersions" | "labelVersions" | "schema" | "acRules" | "lineage" | "quality" | "storage";

export default async function OperatorAssets() {
  const [activeTab, setActiveTab] = useState<AssetTab>("datasets");

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { datasets: { include: { versions: true } } },
  });

  const totalDatasets = projects.reduce((sum, p) => sum + p.datasets.length, 0);
  const totalItems = projects.reduce(
    (sum, p) => sum + p.datasets.reduce((s, d) => s + (d.itemCount ?? 0), 0),
    0
  );

  const tabs: { key: AssetTab; label: string; icon: string }[] = [
    { key: "datasets", label: "数据集管理", icon: "📦" },
    { key: "dataVersions", label: "数据版本", icon: "🔄" },
    { key: "labelVersions", label: "标签版本", icon: "🏷️" },
    { key: "schema", label: "Schema管理", icon: "📋" },
    { key: "acRules", label: "AC验收规则", icon: "✅" },
    { key: "lineage", label: "数据血缘", icon: "🔗" },
    { key: "quality", label: "数据质量", icon: "📊" },
    { key: "storage", label: "数据存储", icon: "☁️" },
  ];

  return (
    <div className="opWorkbench">
      <div className="opBanner">
        <div className="opBannerIcon">🧠</div>
        <div className="opBannerInfo">
          <strong>数据资产管理</strong>
          <p>系统记忆层 · 数据版本 · 标签质量 · AC规则 · 模型关联</p>
        </div>
        <div className="opBannerStats">
          <div>
            <strong>{totalDatasets}</strong>
            <span>数据集</span>
          </div>
          <div>
            <strong>{totalItems.toLocaleString()}</strong>
            <span>总数据量</span>
          </div>
          <div>
            <strong>{projects.length}</strong>
            <span>关联项目</span>
          </div>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">📦</span>
          <div>
            <strong>{totalDatasets}</strong>
            <span>数据集</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🔄</span>
          <div>
            <strong>18</strong>
            <span>数据版本</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🏷️</span>
          <div>
            <strong>42</strong>
            <span>标签版本</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong>97.8%</strong>
            <span>质量合格率</span>
          </div>
        </div>
      </div>

      <div className="settingsTabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`settingsTab ${activeTab === tab.key ? "active" : ""}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="cardBody">
          {activeTab === "datasets" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">数据集列表</h3>
                <button className="primaryBtn">创建数据集</button>
              </div>
              <div className="projectTable">
                <div className="tableHeadRow">
                  <div>数据集名称</div>
                  <div>所属项目</div>
                  <div>数据量</div>
                  <div>数据类型</div>
                  <div>版本数</div>
                  <div>更新时间</div>
                  <div>操作</div>
                </div>
                {projects.flatMap((p) =>
                  p.datasets.map((d) => (
                    <div className="tableDataRow" key={d.id}>
                      <div className="mono">{d.name}</div>
                      <div>{p.name}</div>
                      <div>{(d.itemCount ?? 0).toLocaleString()}</div>
                      <div className="mono">{d.type}</div>
                      <div>{d.versions.length}</div>
                      <div className="mono">{formatDate(d.updatedAt)}</div>
                      <div>
                        <button className="linkBtn">查看</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "dataVersions" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">数据版本管理</h3>
                <button className="primaryBtn">创建版本</button>
              </div>
              <div className="versionTimeline">
                {projects.flatMap((p) =>
                  p.datasets.map((d) => (
                    <div className="versionGroup" key={d.id}>
                      <div className="versionGroupHeader">
                        <strong>{d.name}</strong>
                        <span className="mono">{d.type}</span>
                      </div>
                      <div className="versionList">
                        {d.versions.length > 0 ? (
                          d.versions.map((v, idx) => (
                            <div className="versionItem" key={v.id}>
                              <div className="versionDot" style={{ background: idx === 0 ? "#0aa866" : "#9aa7b5" }} />
                              <div className="versionInfo">
                                <strong>{v.version}</strong>
                                <span className="mono">{formatDate(v.createdAt)}</span>
                              </div>
                              <div className="versionMeta">
                                <span>{v.itemCount ?? 0} 条数据</span>
                              </div>
                              <div className="versionActions">
                                <button className="linkBtn">详情</button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="versionItem">
                            <div className="versionDot" style={{ background: "#9aa7b5" }} />
                            <div className="versionInfo">
                              <strong>{d.version}</strong>
                              <span className="mono">{formatDate(d.createdAt)}</span>
                            </div>
                            <div className="versionMeta">
                              <span>{d.itemCount ?? 0} 条数据</span>
                            </div>
                            <div className="versionActions">
                              <button className="linkBtn">详情</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "labelVersions" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">标签版本管理</h3>
                <button className="primaryBtn">创建标签版本</button>
              </div>
              <div className="projectTable">
                <div className="tableHeadRow">
                  <div>标签版本</div>
                  <div>关联数据集</div>
                  <div>标签类型</div>
                  <div>标注数量</div>
                  <div>准确率</div>
                  <div>创建时间</div>
                  <div>操作</div>
                </div>
                {[
                  { name: "v1.0", dataset: "PRJ-001-图像数据", type: "分类标注", count: 10000, accuracy: "98.2%", date: "2026-01-15" },
                  { name: "v1.1", dataset: "PRJ-001-图像数据", type: "分类标注", count: 12000, accuracy: "98.5%", date: "2026-02-20" },
                  { name: "v2.0", dataset: "PRJ-001-图像数据", type: "细粒度标注", count: 15000, accuracy: "97.8%", date: "2026-03-10" },
                  { name: "v1.0", dataset: "PRJ-002-语音数据", type: "语音转写", count: 5000, accuracy: "96.4%", date: "2026-02-25" },
                  { name: "v1.0", dataset: "PRJ-003-NLP数据", type: "NER标注", count: 8000, accuracy: "99.1%", date: "2026-03-05" },
                ].map((v) => (
                  <div className="tableDataRow" key={`${v.name}-${v.dataset}`}>
                    <div className="mono">{v.name}</div>
                    <div>{v.dataset}</div>
                    <div>{v.type}</div>
                    <div>{v.count.toLocaleString()}</div>
                    <div style={{ color: "rgb(10, 168, 102)" }}><strong>{v.accuracy}</strong></div>
                    <div className="mono">{v.date}</div>
                    <div>
                      <button className="linkBtn">查看</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "schema" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">Schema 管理</h3>
                <button className="primaryBtn">新建 Schema</button>
              </div>
              <div className="projectTable">
                <div className="tableHeadRow">
                  <div>Schema 名称</div>
                  <div>版本</div>
                  <div>字段数</div>
                  <div>数据类型</div>
                  <div>关联数据集</div>
                  <div>创建时间</div>
                  <div>操作</div>
                </div>
                {[
                  { name: "图像分类 Schema", version: "v1.0", fields: 8, dataType: "图像", datasets: 3, date: "2026-01-10" },
                  { name: "语音转写 Schema", version: "v1.1", fields: 5, dataType: "语音", datasets: 2, date: "2026-02-15" },
                  { name: "NLP标注 Schema", version: "v1.0", fields: 12, dataType: "文本", datasets: 2, date: "2026-03-01" },
                  { name: "视频标注 Schema", version: "v1.0", fields: 6, dataType: "视频", datasets: 1, date: "2026-03-10" },
                ].map((s) => (
                  <div className="tableDataRow" key={`${s.name}-${s.version}`}>
                    <div>{s.name}</div>
                    <div className="mono">{s.version}</div>
                    <div>{s.fields}</div>
                    <div>{s.dataType}</div>
                    <div>{s.datasets} 个</div>
                    <div className="mono">{s.date}</div>
                    <div>
                      <button className="linkBtn">查看</button>
                      <button className="linkBtn">编辑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "acRules" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">AC 验收规则</h3>
                <button className="primaryBtn">新建规则</button>
              </div>
              <div className="ruleList">
                {[
                  { id: "RULE-001", name: "图像分类验收规则", type: "分类标注", datasets: ["PRJ-001-图像数据"], accuracy: "95%", coverage: "100%", status: "active" },
                  { id: "RULE-002", name: "语音转写验收规则", type: "语音转写", datasets: ["PRJ-002-语音数据"], accuracy: "92%", coverage: "98%", status: "active" },
                  { id: "RULE-003", name: "NLP标注验收规则", type: "NER标注", datasets: ["PRJ-003-NLP数据"], accuracy: "96%", coverage: "100%", status: "active" },
                  { id: "RULE-004", name: "视频标注验收规则", type: "视频标注", datasets: ["PRJ-004-视频数据"], accuracy: "94%", coverage: "95%", status: "draft" },
                ].map((rule) => (
                  <div className="ruleCard" key={rule.id}>
                    <div className="ruleHeader">
                      <strong>{rule.name}</strong>
                      <span className={`statusBadge ${rule.status === "active" ? "green" : "gray"}`}>
                        {rule.status === "active" ? "生效中" : "草稿"}
                      </span>
                    </div>
                    <div className="ruleBody">
                      <div className="ruleMeta">
                        <span className="mono">{rule.id}</span>
                        <span>{rule.type}</span>
                      </div>
                      <div className="ruleTargets">
                        <span>关联数据集：</span>
                        {rule.datasets.map((d) => (
                          <span key={d} className="tinyTag">{d}</span>
                        ))}
                      </div>
                      <div className="ruleMetrics">
                        <div>
                          <span>准确率阈值</span>
                          <strong>{rule.accuracy}</strong>
                        </div>
                        <div>
                          <span>覆盖率阈值</span>
                          <strong>{rule.coverage}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="ruleFooter">
                      <button className="ghostBtn">查看规则</button>
                      <button className="ghostBtn">编辑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "lineage" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">数据血缘</h3>
                <button className="primaryBtn">查看完整图</button>
              </div>
              <div className="lineageContainer">
                <div className="lineageFlow">
                  <div className="lineageNode source">
                    <span className="nodeIcon">📥</span>
                    <span>原始数据</span>
                    <span className="nodeCount">150K</span>
                  </div>
                  <div className="lineageArrow">→</div>
                  <div className="lineageNode process">
                    <span className="nodeIcon">🔄</span>
                    <span>数据清洗</span>
                  </div>
                  <div className="lineageArrow">→</div>
                  <div className="lineageNode process">
                    <span className="nodeIcon">🏷️</span>
                    <span>标签标注</span>
                  </div>
                  <div className="lineageArrow">→</div>
                  <div className="lineageNode process">
                    <span className="nodeIcon">✅</span>
                    <span>质量验收</span>
                  </div>
                  <div className="lineageArrow">→</div>
                  <div className="lineageNode sink">
                    <span className="nodeIcon">🤖</span>
                    <span>模型训练</span>
                    <span className="nodeCount">v2.3</span>
                  </div>
                </div>
                <div className="lineageLegend">
                  <div>
                    <div className="legendDot source" />
                    <span>数据源</span>
                  </div>
                  <div>
                    <div className="legendDot process" />
                    <span>处理节点</span>
                  </div>
                  <div>
                    <div className="legendDot sink" />
                    <span>模型/输出</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "quality" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">数据质量监控</h3>
                <button className="primaryBtn">查看报告</button>
              </div>
              <div className="qualityGrid">
                <div className="qualityCard">
                  <div className="qualityHeader">
                    <span className="qualityIcon">✅</span>
                    <strong>整体合格率</strong>
                  </div>
                  <div className="qualityValue">97.8%</div>
                  <div className="qualityTrend up">+0.5%</div>
                </div>
                <div className="qualityCard">
                  <div className="qualityHeader">
                    <span className="qualityIcon">🏷️</span>
                    <strong>标签一致性</strong>
                  </div>
                  <div className="qualityValue">98.2%</div>
                  <div className="qualityTrend up">+0.3%</div>
                </div>
                <div className="qualityCard">
                  <div className="qualityHeader">
                    <span className="qualityIcon">📊</span>
                    <strong>数据完整性</strong>
                  </div>
                  <div className="qualityValue">96.5%</div>
                  <div className="qualityTrend down">-0.2%</div>
                </div>
                <div className="qualityCard">
                  <div className="qualityHeader">
                    <span className="qualityIcon">🔄</span>
                    <strong>标注一致性</strong>
                  </div>
                  <div className="qualityValue">99.1%</div>
                  <div className="qualityTrend up">+0.8%</div>
                </div>
              </div>
              <div className="card">
                <div className="cardHeader">
                  <h3 className="cardTitle">质量问题列表</h3>
                </div>
                <div className="cardBody noPadding">
                  <div className="projectTable">
                    <div className="tableHeadRow">
                      <div>问题类型</div>
                      <div>数据集</div>
                      <div>数量</div>
                      <div>严重程度</div>
                      <div>发现时间</div>
                      <div>处理状态</div>
                    </div>
                    {[
                      { type: "标注错误", dataset: "PRJ-001-图像数据", count: 45, severity: "high", time: "2026-07-13", status: "处理中" },
                      { type: "数据缺失", dataset: "PRJ-002-语音数据", count: 120, severity: "medium", time: "2026-07-12", status: "待处理" },
                      { type: "标签不一致", dataset: "PRJ-003-NLP数据", count: 28, severity: "low", time: "2026-07-11", status: "已处理" },
                    ].map((issue) => (
                      <div className="tableDataRow" key={`${issue.type}-${issue.dataset}`}>
                        <div>{issue.type}</div>
                        <div>{issue.dataset}</div>
                        <div>{issue.count}</div>
                        <div>
                          <span className={`severityBadge ${issue.severity}`}>
                            {issue.severity === "high" ? "高" : issue.severity === "medium" ? "中" : "低"}
                          </span>
                        </div>
                        <div className="mono">{issue.time}</div>
                        <div>{issue.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">数据存储</h3>
                <button className="primaryBtn">新增存储</button>
              </div>
              <div className="storageList">
                {[
                  { id: "STORE-001", name: "阿里云 OSS - 生产环境", type: "OSS", location: "华东2", size: "2.5 TB", used: "1.8 TB", status: "active" },
                  { id: "STORE-002", name: "腾讯云 COS - 测试环境", type: "COS", location: "广州", size: "500 GB", used: "200 GB", status: "active" },
                  { id: "STORE-003", name: "本地存储 - 开发环境", type: "Local", location: "localhost", size: "100 GB", used: "45 GB", status: "active" },
                ].map((store) => (
                  <div className="storageCard" key={store.id}>
                    <div className="storageHeader">
                      <strong>{store.name}</strong>
                      <span className={`statusBadge ${store.status === "active" ? "green" : "gray"}`}>
                        {store.status === "active" ? "在线" : "离线"}
                      </span>
                    </div>
                    <div className="storageBody">
                      <div className="storageMeta">
                        <span>类型：{store.type}</span>
                        <span>位置：{store.location}</span>
                      </div>
                      <div className="storageUsage">
                        <div className="usageBar">
                          <div className="usageFill" style={{ width: `${(parseFloat(store.used) / parseFloat(store.size.replace("TB", "1024").replace("GB", "")) * 100).toFixed(1)}%` }} />
                        </div>
                        <div className="usageText">
                          <span>{store.used}</span>
                          <span>/{store.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="storageFooter">
                      <button className="ghostBtn">连接信息</button>
                      <button className="ghostBtn">清理</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
