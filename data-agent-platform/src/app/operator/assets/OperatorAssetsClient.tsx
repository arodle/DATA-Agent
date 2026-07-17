"use client";

import { useState } from "react";

type AssetTab = "datasets" | "dataVersions" | "labelVersions" | "schema" | "acRules" | "lineage" | "quality" | "storage" | "builtin";

interface DatasetVersion {
  id: string;
  version: string;
  itemCount: number | null;
  createdAt: Date;
}

interface DatasetData {
  id: string;
  name: string;
  type: string;
  itemCount: number | null;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  versions: DatasetVersion[];
  projectName: string;
}

interface OperatorAssetsClientProps {
  totalDatasets: number;
  totalItems: number;
  projectCount: number;
  datasets: DatasetData[];
}

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

export default function OperatorAssetsClient({
  totalDatasets,
  totalItems,
  projectCount,
  datasets,
}: OperatorAssetsClientProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>("datasets");

  const tabs: { key: AssetTab; label: string; icon: string }[] = [
    { key: "datasets", label: "数据集管理", icon: "📦" },
    { key: "dataVersions", label: "数据版本", icon: "🔄" },
    { key: "labelVersions", label: "标签版本", icon: "🏷️" },
    { key: "schema", label: "Schema管理", icon: "📋" },
    { key: "acRules", label: "AC验收规则", icon: "✅" },
    { key: "lineage", label: "数据血缘", icon: "🔗" },
    { key: "quality", label: "数据质量", icon: "📊" },
    { key: "storage", label: "数据存储", icon: "☁️" },
    { key: "builtin", label: "内置资产", icon: "🏛️" },
  ];

  const [builtinSubTab, setBuiltinSubTab] = useState("builtin-source");

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
            <strong>{projectCount}</strong>
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
                {datasets.map((d) => (
                  <div className="tableDataRow" key={d.id}>
                    <div className="mono">{d.name}</div>
                    <div>{d.projectName}</div>
                    <div>{(d.itemCount ?? 0).toLocaleString()}</div>
                    <div className="mono">{d.type}</div>
                    <div>{d.versions.length}</div>
                    <div className="mono">{formatDate(d.updatedAt)}</div>
                    <div>
                      <button className="linkBtn">查看</button>
                    </div>
                  </div>
                ))}
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
                {datasets.map((d) => (
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
                ))}
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

          {activeTab === "builtin" && (
            <div className="assetsPanel">
              <div className="cardHeader">
                <h3 className="cardTitle">🏛️ 内置资产</h3>
                <span className="statusBadge green">运营管理</span>
              </div>
              <p style={{ fontSize: 13, color: "#697889", margin: "0 0 20px", lineHeight: 1.6 }}>
                平台沉淀的四类核心资产：数据源规划成熟方案、供应商与报价工期基准、标准化规范与脚本质检资产、完整历史项目包。支持一键复用，加速项目交付。
              </p>

              <div className="settingsTabs" style={{ marginBottom: 20 }}>
                {[
                  { key: "builtin-source", label: "📊 数据源方案", },
                  { key: "builtin-supplier", label: "🏭 供应商报价", },
                  { key: "builtin-standard", label: "📐 规范脚本", },
                  { key: "builtin-project", label: "📦 项目包", },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBuiltinSubTab(tab.key)}
                    className={`settingsTab ${builtinSubTab === tab.key ? "active" : ""}`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {builtinSubTab === "builtin-source" && (
                <div className="builtinGrid">
                  {/* 纯仿真方案 */}
                  <div className="builtinCard">
                    <div className="builtinCardHead">
                      <span className="builtinCardIcon">🎮</span>
                      <div><strong>纯仿真方案</strong><span className="builtinTag green">推荐</span></div>
                    </div>
                    <ul className="builtinList">
                      <li>适用：边缘场景、极端天气、稀有目标</li>
                      <li>精度：100% 精确标注（无人工误差）</li>
                      <li>速度：5,000-10,000张/天</li>
                      <li>成本：约 0.3-0.8元/张</li>
                      <li>工具：CARLA/AirSim 集成</li>
                    </ul>
                    <button className="linkBtn">复用方案</button>
                  </div>
                  {/* 成品数据集采购 */}
                  <div className="builtinCard">
                    <div className="builtinCardHead">
                      <span className="builtinCardIcon">🛒</span>
                      <div><strong>成品数据集采购</strong><span className="builtinTag blue">高频</span></div>
                    </div>
                    <ul className="builtinList">
                      <li>适用：快速启动、冷启动基线</li>
                      <li>数据：CityScapes/BDD100K/COCO/KITTI/nuScenes</li>
                      <li>交付：1-3个工作日</li>
                      <li>规模：5,000-200,000张可选</li>
                      <li>含 Schema 适配脚本</li>
                    </ul>
                    <button className="linkBtn">复用方案</button>
                  </div>
                  {/* 采标一体 */}
                  <div className="builtinCard">
                    <div className="builtinCardHead">
                      <span className="builtinCardIcon">📷</span>
                      <div><strong>采标一体方案</strong><span className="builtinTag green">推荐</span></div>
                    </div>
                    <ul className="builtinList">
                      <li>适用：完整项目链一站式</li>
                      <li>流程：采集→清洗→预标→标注→验收</li>
                      <li>规模：5,000-100,000张</li>
                      <li>周期：1-4个月</li>
                      <li>含采集方案+标注规范+验收全套</li>
                    </ul>
                    <button className="linkBtn">复用方案</button>
                  </div>
                  {/* 纯采集 */}
                  <div className="builtinCard">
                    <div className="builtinCardHead">
                      <span className="builtinCardIcon">🚗</span>
                      <div><strong>纯采集方案</strong><span className="builtinTag">灵活</span></div>
                    </div>
                    <ul className="builtinList">
                      <li>适用：自研标注、只要原始数据</li>
                      <li>方式：车载/无人机/固定相机</li>
                      <li>规模：5,000-200,000张</li>
                      <li>周期：1-2个月</li>
                      <li>含场景规划+设备方案</li>
                    </ul>
                    <button className="linkBtn">复用方案</button>
                  </div>
                  {/* 仿真+采集混合 */}
                  <div className="builtinCard">
                    <div className="builtinCardHead">
                      <span className="builtinCardIcon">🎯</span>
                      <div><strong>仿真+采集混合</strong><span className="builtinTag blue">高频</span></div>
                    </div>
                    <ul className="builtinList">
                      <li>适用：真实场景+边缘覆盖</li>
                      <li>配比：15K仿真 + 35K采集（典型）</li>
                      <li>仿真覆盖：夜间/雨雪/雾天/隧道</li>
                      <li>周期：2-3个月</li>
                      <li>含仿真配置+采集方案</li>
                    </ul>
                    <button className="linkBtn">复用方案</button>
                  </div>
                  {/* 采购+标注混合 */}
                  <div className="builtinCard">
                    <div className="builtinCardHead">
                      <span className="builtinCardIcon">🔗</span>
                      <div><strong>采购+标注混合</strong><span className="builtinTag">综合</span></div>
                    </div>
                    <ul className="builtinList">
                      <li>适用：有成品数据+需要标注</li>
                      <li>模式：成品采购+自主/外包标注</li>
                      <li>规模：灵活配置</li>
                      <li>周期：1-3个月</li>
                      <li>含数据集适配+标注执行方案</li>
                    </ul>
                    <button className="linkBtn">复用方案</button>
                  </div>
                </div>
              )}

              {builtinSubTab === "builtin-supplier" && (
                <>
                  <h4>标注类供应商</h4>
                  <div className="supplierTable">
                    <div className="supplierRow supplierHead">
                      <span>供应商</span><span>专项</span><span>单价</span><span>产能</span><span>返修率</span><span>评分</span><span>标准工期</span><span>试标报价</span>
                    </div>
                    {[
                      ["标注星球","2D框/车辆","0.8元/框","20,000框/天","2.3%","⭐⭐⭐⭐⭐ 4.8","3个月/50K","0.75元/框"],
                      ["AI标注工厂","2D框/行人","0.72元/框","15,000框/天","3.1%","⭐⭐⭐⭐ 4.5","2.5个月/50K","0.68元/框"],
                      ["数据工匠","2D框/通用","0.68元/框","12,000框/天","3.8%","⭐⭐⭐⭐ 4.3","3.5个月/50K","0.65元/框"],
                      ["标注大师","分割/3D","2.5元/框","5,000框/天","1.8%","⭐⭐⭐⭐⭐ 4.9","2个月/10K","2.2元/框"],
                    ].map((r,i) => (
                      <div className="supplierRow" key={i}>
                        <span className="supplierName">{r[0]}</span>
                        <span>{r[1]}</span><span className="mono">{r[2]}</span>
                        <span>{r[3]}</span><span className="good">{r[4]}</span>
                        <span>{r[5]}</span><span>{r[6]}</span><span className="mono">{r[7]}</span>
                      </div>
                    ))}
                  </div>
                  <h4 style={{ marginTop: 24 }}>采集类供应商</h4>
                  <div className="supplierTable">
                    <div className="supplierRow supplierHead">
                      <span>供应商</span><span>场景</span><span>单价</span><span>产能</span><span>设备</span><span>评分</span><span>标准工期</span>
                    </div>
                    {[
                      ["采集先锋","城市道路","1.2元/张","3,000张/天","5台车","⭐⭐⭐⭐ 4.5","1.5个月/50K"],
                      ["视觉猎手","室内/园区","0.8元/张","5,000张/天","3台设备","⭐⭐⭐⭐ 4.3","1个月/50K"],
                      ["航拍专家","航空/遥感","5.0元/张","500张/天","2架无人机","⭐⭐⭐⭐ 4.6","2个月/20K"],
                    ].map((r,i) => (
                      <div className="supplierRow" key={i}>
                        <span className="supplierName">{r[0]}</span><span>{r[1]}</span>
                        <span className="mono">{r[2]}</span><span>{r[3]}</span>
                        <span>{r[4]}</span><span>{r[5]}</span><span>{r[6]}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {builtinSubTab === "builtin-standard" && (
                <div className="builtinGrid">
                  {[
                    { icon:"📋", title:"标注规范模板", tag:"6个模板", tagCls:"green", items:["2D框标注规范 v2.2","语义分割规范 v1.5","OCR文字标注 v2.0","3D点云标注 v1.3","关键点标注 v1.2","视频标注 v1.8"] },
                    { icon:"✅", title:"AC验收规则", tag:"3大类", tagCls:"blue", items:["框精度AC：≤3px/5px/10px","漏标率AC：≤2%/3%/5%","交叉验证：2轮/3轮","含自动化验收脚本","质量报告模板"] },
                    { icon:"🏗️", title:"Schema资产库", tag:"5种格式", items:["COCO JSON（目标检测）","YOLO TXT","Pascal VOC XML","CityScapes JSON（分割）","KITTI Label（3D）"] },
                    { icon:"🔧", title:"处理脚本", tag:"12个脚本", tagCls:"blue", items:["数据清洗（去重/去模糊）","预标脚本（YOLOv8）","格式转换 YOLO↔COCO","数据集划分 train/val/test","标注可视化","质量报告生成"] },
                    { icon:"📊", title:"质量报告模板", tag:"4种", tagCls:"green", items:["批次验收质量报告","供应商质量分析","标采员问题统计","项目终期总结"] },
                    { icon:"🔗", title:"API工具集成", tag:"推荐", items:["预标 API（YOLOv8/ResNet）","仿真生成 API（CARLA）","Cloud Storage连接器","Webhook任务通知"] },
                  ].map((c,i) => (
                    <div className="builtinCard" key={i}>
                      <div className="builtinCardHead">
                        <span className="builtinCardIcon">{c.icon}</span>
                        <div><strong>{c.title}</strong><span className={`builtinTag${c.tagCls ? " "+c.tagCls : ""}`}>{c.tag}</span></div>
                      </div>
                      <ul className="builtinList">{c.items.map((it,j)=><li key={j}>{it}</li>)}</ul>
                      <button className="linkBtn">查看详情</button>
                    </div>
                  ))}
                </div>
              )}

              {builtinSubTab === "builtin-project" && (
                <div className="projectArchiveList">
                  {[
                    { name:"PRJ-A23K：城市道路车辆2D框标注", meta:"48,000张 | 3个月 | 评分 4.8 | 2025-12", tag:"可复用", tagCls:"green", assets:[["📊 数据方案","仿真+采集（15K+33K）"],["📋 标注规范","v2.1（12条规则）"],["✅ AC规则","≤3px,3轮交叉验证"],["🏗️ Schema","COCO JSON/5类"],["🏭 供应商","标注星球/0.8元/框"],["🔧 脚本","清洗+预标+转换"]] },
                    { name:"PRJ-B12M：城市道路行人车辆检测", meta:"36,000张 | 2.5个月 | 评分 4.6 | 2025-10", tag:"可复用", tagCls:"blue", assets:[["📊 数据方案","成品采购（CityScapes）"],["📋 标注规范","v1.9（行人属性）"],["✅ AC规则","≤5px,2轮交叉"],["🏗️ Schema","COCO JSON/人行+车辆"],["🏭 供应商","AI标注工厂/0.72元/框"]] },
                    { name:"PRJ-C04L：高速场景车辆标注", meta:"62,000张 | 4个月 | 评分 4.3 | 2025-08", tag:"可复用", assets:[["📊 数据方案","纯采集（车载+无人机）"],["📋 标注规范","v1.7（高速专项）"],["🔧 脚本","图像对齐+拼接"]] },
                  ].map((p,i) => (
                    <div className="archiveCard" key={i}>
                      <div className="archiveHeader">
                        <span className="archiveIcon">📦</span>
                        <div className="archiveInfo"><strong>{p.name}</strong><span className="archiveMeta">{p.meta}</span></div>
                        <span className={`builtinTag${p.tagCls ? " "+p.tagCls : ""}`}>{p.tag}</span>
                      </div>
                      <div className="archiveAssets">
                        {p.assets.map((a,j)=>(<div className="archiveAssetItem" key={j}><span className="archiveAssetLabel">{a[0]}</span><span>{a[1]}</span></div>))}
                      </div>
                      <button className="primaryBtn archiveBtn">一键复用整套项目</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
