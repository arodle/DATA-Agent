"use client";

import { useState } from "react";

export type DatasetItem = {
  id: string;
  name: string;
  type: string;
  modality: string | null;
  itemCount: number | null;
  format: string | null;
  storagePath: string | null;
  version: string;
  source: string | null;
  createdAt: Date;
  versions: { id: string; version: string; changeNote: string | null; itemCount: number | null; createdAt: Date }[];
};

export type FileItem = {
  id: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: bigint | null;
  storagePath: string;
  checksum: string | null;
  assetType: string | null;
  createdAt: Date;
};

export type PublicAssetItem = {
  id: string;
  type: string;
  name: string;
  source: string | null;
  license: string | null;
  modality: string | null;
  taskType: string | null;
  format: string | null;
  description: string | null;
  isOfficial: boolean;
  createdAt: Date;
};

type Props = {
  datasets: DatasetItem[];
  files: FileItem[];
  publicAssets: PublicAssetItem[];
};

const mainTabs = [
  { key: "dataset", label: "数据集管理" },
  { key: "storage", label: "数据存储" },
  { key: "public", label: "公共资源" },
];

const datasetSubTabs = [
  { key: "data-version", label: "数据版本" },
  { key: "label-version", label: "标签版本" },
  { key: "schema", label: "Schema" },
  { key: "ac-rule", label: "AC 验收规则" },
  { key: "lineage", label: "数据血缘" },
];

const publicSubTabs = [
  { key: "pub-dataset", label: "公开数据集" },
  { key: "pub-schema", label: "公开 Schema" },
  { key: "pub-label", label: "公开标签" },
];

function formatBytes(bytes: bigint | null) {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Number(bytes);
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function DataAssetsClient({ datasets, files, publicAssets }: Props) {
  const [mainTab, setMainTab] = useState("dataset");
  const [subTab, setSubTab] = useState("data-version");

  const labelDatasets = datasets.filter((d) => d.type === "LABEL" || d.type === "label");
  const dataDatasets = datasets.filter((d) => d.type !== "LABEL" && d.type !== "label");
  const schemaAssets = publicAssets.filter((a) => a.type === "SCHEMA" || a.type === "schema");
  const pubDatasets = publicAssets.filter((a) => a.type === "DATASET" || a.type === "dataset");
  const pubLabels = publicAssets.filter((a) => a.type === "LABEL" || a.type === "label");

  const totalDataSize = files.reduce((sum, f) => sum + (f.sizeBytes ?? BigInt(0)), BigInt(0));

  return (
    <>
      <header className="roleTopbar">
        <div>
          <p className="crumb">用户视角 / 数据资产</p>
          <h1>数据资产管理</h1>
        </div>
        <div className="topbarRight">
          <span className="statusTag">{datasets.length} 个数据集 · {files.length} 个文件</span>
          <button className="primaryBtn">上传数据</button>
        </div>
      </header>

      <div className="dataAssetsLayout">
        <aside className="dataSideNav">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              className={mainTab === tab.key ? "dataSideItem active" : "dataSideItem"}
              onClick={() => {
                setMainTab(tab.key);
                if (tab.key === "dataset") setSubTab("data-version");
                if (tab.key === "public") setSubTab("pub-dataset");
              }}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <div className="dataContent">
          {mainTab === "dataset" && (
            <>
              <div className="subTabBar">
                {datasetSubTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={subTab === tab.key ? "subTabItem active" : "subTabItem"}
                    onClick={() => setSubTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {subTab === "data-version" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>数据版本</h3>
                    <button className="outlineBtn">新建版本</button>
                  </div>
                  <div className="versionTable">
                    <div className="versionRow versionHead">
                      <span>数据集</span>
                      <span>版本</span>
                      <span>数据量</span>
                      <span>变更说明</span>
                      <span>创建时间</span>
                      <span>操作</span>
                    </div>
                    {dataDatasets.length === 0 && (
                      <div className="versionRow empty">暂无数据集</div>
                    )}
                    {dataDatasets.flatMap((ds) =>
                      ds.versions.length > 0
                        ? ds.versions.map((v) => (
                            <div className="versionRow" key={v.id}>
                              <span className="mono">{ds.name}</span>
                              <span><span className="versionBadge">{v.version}</span></span>
                              <span>{v.itemCount?.toLocaleString() ?? "-"} 条</span>
                              <span className="versionNote">{v.changeNote ?? "-"}</span>
                              <span>{formatDate(v.createdAt)}</span>
                              <span><button className="linkBtn">详情</button></span>
                            </div>
                          ))
                        : (
                          <div className="versionRow" key={ds.id}>
                            <span className="mono">{ds.name}</span>
                            <span><span className="versionBadge">{ds.version}</span></span>
                            <span>{ds.itemCount?.toLocaleString() ?? "-"} 条</span>
                            <span className="versionNote">初始版本</span>
                            <span>{formatDate(ds.createdAt)}</span>
                            <span><button className="linkBtn">详情</button></span>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}

              {subTab === "label-version" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>标签版本</h3>
                    <button className="outlineBtn">新建标签版本</button>
                  </div>
                  <div className="versionTable">
                    <div className="versionRow versionHead">
                      <span>标签集</span>
                      <span>版本</span>
                      <span>数据量</span>
                      <span>变更说明</span>
                      <span>创建时间</span>
                      <span>操作</span>
                    </div>
                    {labelDatasets.length === 0 && dataDatasets.length === 0 && (
                      <div className="versionRow empty">暂无标签版本</div>
                    )}
                    {(labelDatasets.length > 0 ? labelDatasets : dataDatasets).map((ds) => (
                      <div className="versionRow" key={ds.id}>
                        <span className="mono">{ds.name}</span>
                        <span><span className="versionBadge blue">{ds.version}</span></span>
                        <span>{ds.itemCount?.toLocaleString() ?? "-"} 条</span>
                        <span className="versionNote">{ds.source ?? "标注生成"}</span>
                        <span>{formatDate(ds.createdAt)}</span>
                        <span><button className="linkBtn">详情</button></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subTab === "schema" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>Schema 定义</h3>
                    <button className="outlineBtn">新建 Schema</button>
                  </div>
                  <div className="schemaGrid">
                    {dataDatasets.map((ds) => (
                      <div className="schemaCard" key={ds.id}>
                        <div className="schemaCardHead">
                          <span className="schemaIcon">📋</span>
                          <strong>{ds.name}</strong>
                          <span className="schemaFormat">{ds.format ?? "JSON"}</span>
                        </div>
                        <div className="schemaBody">
                          <div className="schemaField">
                            <span>字段</span>
                            <strong>id, image_url, label, bbox</strong>
                          </div>
                          <div className="schemaField">
                            <span>模态</span>
                            <strong>{ds.modality ?? "image"}</strong>
                          </div>
                          <div className="schemaField">
                            <span>数据量</span>
                            <strong>{ds.itemCount?.toLocaleString() ?? "-"} 条</strong>
                          </div>
                          <div className="schemaField">
                            <span>存储路径</span>
                            <strong className="mono small">{ds.storagePath ?? "-"}</strong>
                          </div>
                        </div>
                        <div className="schemaFooter">
                          <button className="linkBtn">查看 JSON</button>
                          <button className="linkBtn">编辑</button>
                        </div>
                      </div>
                    ))}
                    {dataDatasets.length === 0 && (
                      <div className="emptyState">暂无 Schema 定义</div>
                    )}
                  </div>
                </div>
              )}

              {subTab === "ac-rule" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>AC 验收规则</h3>
                    <button className="outlineBtn">新建规则</button>
                  </div>
                  <div className="acRuleList">
                    {dataDatasets.map((ds, i) => (
                      <div className="acRuleCard" key={ds.id}>
                        <div className="acRuleHead">
                          <span className="acRuleNum">AC-{String(i + 1).padStart(3, "0")}</span>
                          <strong>{ds.name} 验收规则</strong>
                          <span className="acRuleStatus">启用中</span>
                        </div>
                        <div className="acRuleBody">
                          <div className="acRuleItem">
                            <span className="acRuleCheck">✓</span>
                            <span>标注框完整率 ≥ 98%</span>
                          </div>
                          <div className="acRuleItem">
                            <span className="acRuleCheck">✓</span>
                            <span>类别准确率 ≥ 95%</span>
                          </div>
                          <div className="acRuleItem">
                            <span className="acRuleCheck">✓</span>
                            <span>漏标率 ≤ 2%</span>
                          </div>
                          <div className="acRuleItem">
                            <span className="acRuleCheck warn">!</span>
                            <span>框偏移 ≤ 3px（需人工抽检）</span>
                          </div>
                        </div>
                        <div className="acRuleFooter">
                          <button className="linkBtn">编辑规则</button>
                          <button className="linkBtn">查看历史</button>
                        </div>
                      </div>
                    ))}
                    {dataDatasets.length === 0 && (
                      <div className="emptyState">暂无验收规则</div>
                    )}
                  </div>
                </div>
              )}

              {subTab === "lineage" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>AI 数据血缘</h3>
                    <div style={{ display: "flex", gap: 10 }}>
                      <select className="computeFilter">
                        <option>选择模型</option>
                        <option>YOLOv8-X 目标检测</option>
                        <option>SAM-ViT-H 分割</option>
                        <option>Qwen-VL-72B 多模态</option>
                      </select>
                      <button className="outlineBtn">导出血缘图</button>
                    </div>
                  </div>

                  <div className="aiLineageBanner">
                    <span className="aiLineageIcon">🔍</span>
                    <div>
                      <strong>反向追溯能力</strong>
                      <p>从模型效果指标出发，精准追溯到使用了哪些数据、标签、规则和生产过程</p>
                    </div>
                  </div>

                  <div className="lineageMetrics">
                    <div className="metricCard">
                      <span className="metricIcon">🎯</span>
                      <strong>mAP@0.5</strong>
                      <span className="metricValue">92.4%</span>
                      <span className="metricLabel">检测精度</span>
                    </div>
                    <div className="metricCard">
                      <span className="metricIcon">📊</span>
                      <strong>召回率</strong>
                      <span className="metricValue">89.1%</span>
                      <span className="metricLabel">目标召回</span>
                    </div>
                    <div className="metricCard">
                      <span className="metricIcon">⚡</span>
                      <strong>FPS</strong>
                      <span className="metricValue">45.2</span>
                      <span className="metricLabel">推理速度</span>
                    </div>
                    <div className="metricCard">
                      <span className="metricIcon">✅</span>
                      <strong>AC 通过率</strong>
                      <span className="metricValue">97.8%</span>
                      <span className="metricLabel">验收质量</span>
                    </div>
                  </div>

                  <div className="lineageTimeline">
                    <div className="lineageTimelineHead">
                      <span>训练批次</span>
                      <span>模型版本</span>
                      <span>数据用量</span>
                      <span>标签版本</span>
                      <span>AC 规则</span>
                      <span>效果</span>
                    </div>
                    <div className="lineageTimelineRow">
                      <span><span className="versionBadge">BATCH-003</span></span>
                      <span>v3.2.1</span>
                      <span>142,000 帧</span>
                      <span><span className="versionBadge blue">LBL-v2</span></span>
                      <span>AC-002</span>
                      <span className="metricValue">92.4%</span>
                    </div>
                    <div className="lineageTimelineRow">
                      <span><span className="versionBadge">BATCH-002</span></span>
                      <span>v3.1.0</span>
                      <span>120,000 帧</span>
                      <span><span className="versionBadge blue">LBL-v1</span></span>
                      <span>AC-001</span>
                      <span className="metricValue">89.7%</span>
                    </div>
                    <div className="lineageTimelineRow">
                      <span><span className="versionBadge">BATCH-001</span></span>
                      <span>v3.0.0</span>
                      <span>80,000 帧</span>
                      <span><span className="versionBadge blue">LBL-v0</span></span>
                      <span>AC-001</span>
                      <span className="metricValue">85.2%</span>
                    </div>
                  </div>

                  <div className="lineageGraphContainer">
                    <div className="lineageGraphTitle">数据流向追溯图</div>
                    <div className="lineageGraph">
                      <div className="lineageLevel">
                        <div className="lineageLevelLabel">效果指标</div>
                        <div className="lineageNode effect">
                          <span className="lineageNodeType">模型输出</span>
                          <strong>YOLOv8-X</strong>
                          <span className="lineageNodeMeta">mAP: 92.4%</span>
                        </div>
                      </div>

                      <div className="lineageArrowBig">↓</div>

                      <div className="lineageLevel">
                        <div className="lineageLevelLabel">训练过程</div>
                        <div className="lineageNode train">
                          <span className="lineageNodeType">训练批次</span>
                          <strong>BATCH-003</strong>
                          <span className="lineageNodeMeta">50 epochs · 6h</span>
                        </div>
                        <div className="lineageNode params">
                          <span className="lineageNodeType">超参数</span>
                          <strong>配置</strong>
                          <span className="lineageNodeMeta">batch=32, lr=0.01</span>
                        </div>
                      </div>

                      <div className="lineageArrowBig">↓</div>

                      <div className="lineageLevel">
                        <div className="lineageLevelLabel">数据与标签</div>
                        <div className="lineageNode data">
                          <span className="lineageNodeType">训练数据</span>
                          <strong>traffic_train_v3</strong>
                          <span className="lineageNodeMeta">142,000 帧</span>
                        </div>
                        <div className="lineageNode label">
                          <span className="lineageNodeType">标签数据</span>
                          <strong>traffic_labels_v2</strong>
                          <span className="lineageNodeMeta">8 类 · 456K 标注</span>
                        </div>
                      </div>

                      <div className="lineageArrowBig">↓</div>

                      <div className="lineageLevel">
                        <div className="lineageLevelLabel">规则与质检</div>
                        <div className="lineageNode rule">
                          <span className="lineageNodeType">AC 规则</span>
                          <strong>AC-002</strong>
                          <span className="lineageNodeMeta">完整率≥98%</span>
                        </div>
                        <div className="lineageNode quality">
                          <span className="lineageNodeType">质检结果</span>
                          <strong>质检报告 #20240710</strong>
                          <span className="lineageNodeMeta">合格率 97.8%</span>
                        </div>
                      </div>

                      <div className="lineageArrowBig">↓</div>

                      <div className="lineageLevel">
                        <div className="lineageLevelLabel">原始数据源</div>
                        <div className="lineageNode source">
                          <span className="lineageNodeType">摄像头采集</span>
                          <strong>路口 A/B/C</strong>
                          <span className="lineageNodeMeta">2024-06 ~ 2024-07</span>
                        </div>
                        <div className="lineageNode source">
                          <span className="lineageNodeType">公开数据集</span>
                          <strong>COCO 2017</strong>
                          <span className="lineageNodeMeta">118K 图像</span>
                        </div>
                        <div className="lineageNode source">
                          <span className="lineageNodeType">人工标注</span>
                          <strong>标注团队 #3</strong>
                          <span className="lineageNodeMeta">50K 帧</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lineageDetailPanel">
                    <div className="lineageDetailHead">
                      <strong>追溯详情</strong>
                      <span className="lineageDetailHint">点击上方节点查看详情</span>
                    </div>
                    <div className="lineageDetailGrid">
                      <div className="lineageDetailCard">
                        <div className="lineageDetailCardHead">
                          <span className="lineageDetailIcon">📁</span>
                          <strong>使用的数据</strong>
                        </div>
                        <div className="lineageDetailList">
                          <div className="lineageDetailItem">traffic_train_v3 (142,000 帧)</div>
                          <div className="lineageDetailItem">coco_train_2017 (50,000 帧)</div>
                          <div className="lineageDetailItem">augmented_data (20,000 帧)</div>
                        </div>
                      </div>
                      <div className="lineageDetailCard">
                        <div className="lineageDetailCardHead">
                          <span className="lineageDetailIcon">🏷️</span>
                          <strong>使用的标签</strong>
                        </div>
                        <div className="lineageDetailList">
                          <div className="lineageDetailItem">traffic_labels_v2 (456,000 标注)</div>
                          <div className="lineageDetailItem">COCO 80 类标签</div>
                          <div className="lineageDetailItem">自定义标签: 红绿灯(3)</div>
                        </div>
                      </div>
                      <div className="lineageDetailCard">
                        <div className="lineageDetailCardHead">
                          <span className="lineageDetailIcon">📋</span>
                          <strong>应用的规则</strong>
                        </div>
                        <div className="lineageDetailList">
                          <div className="lineageDetailItem">AC-002: 标注框完整率 ≥ 98%</div>
                          <div className="lineageDetailItem">AC-002: 类别准确率 ≥ 95%</div>
                          <div className="lineageDetailItem">AC-002: 漏标率 ≤ 2%</div>
                        </div>
                      </div>
                      <div className="lineageDetailCard">
                        <div className="lineageDetailCardHead">
                          <span className="lineageDetailIcon">🔄</span>
                          <strong>生产过程</strong>
                        </div>
                        <div className="lineageDetailList">
                          <div className="lineageDetailItem">采集 → 预标注 → 人工修正</div>
                          <div className="lineageDetailItem">数据清洗 → 增强 → 分割</div>
                          <div className="lineageDetailItem">质检 → 返修 → 验收</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {mainTab === "storage" && (
            <div className="dataPanel">
              <div className="dataPanelHead">
                <h3>云存储接入</h3>
              </div>
              <div className="storageInfo">
                <div className="storageBanner">
                  <span className="storageBannerIcon">☁️</span>
                  <div>
                    <strong>平台不存储您的数据</strong>
                    <p>数据保留在您自己的云存储中，平台仅提供跳转和本地拉取能力</p>
                  </div>
                </div>
              </div>
              <div className="cloudStorageList">
                {datasets.map((ds) => {
                  const storagePath = ds.storagePath ?? "";
                  const isOSS = storagePath.includes("oss") || storagePath.includes("aliyun");
                  const isS3 = storagePath.includes("s3") || storagePath.includes("aws");
                  const isGCS = storagePath.includes("gcs") || storagePath.includes("google");
                  const provider = isOSS ? "阿里云 OSS" : isS3 ? "AWS S3" : isGCS ? "Google Cloud" : "云存储";
                  const providerIcon = isOSS ? "🟠" : isS3 ? "🟡" : isGCS ? "🔵" : "☁️";

                  return (
                    <div className="cloudStorageCard" key={ds.id}>
                      <div className="cloudStorageHead">
                        <span className="cloudProviderIcon">{providerIcon}</span>
                        <div className="cloudStorageInfo">
                          <strong>{ds.name}</strong>
                          <span className="cloudProvider">{provider} · {ds.format ?? "RAW"}</span>
                        </div>
                        <span className="cloudItemCount">{ds.itemCount?.toLocaleString() ?? "-"} 条</span>
                      </div>
                      <div className="cloudStoragePath">
                        <span className="cloudPathLabel">存储地址</span>
                        <span className="cloudPathValue">{storagePath || "未配置"}</span>
                      </div>
                      <div className="cloudStorageActions">
                        <button className="cloudBtn primary">
                          <span>↗</span> 跳转云存储
                        </button>
                        <button className="cloudBtn">
                          <span>⬇</span> 拉取到本地
                        </button>
                        <button className="linkBtn">查看配置</button>
                      </div>
                    </div>
                  );
                })}
                {datasets.length === 0 && (
                  <div className="emptyState">暂无已接入的云存储</div>
                )}
              </div>
              <div className="storageHelp">
                <div className="storageHelpHead">接入新存储</div>
                <div className="storageHelpGrid">
                  <button className="storageHelpCard">
                    <span className="storageHelpIcon">🟠</span>
                    <div>
                      <strong>阿里云 OSS</strong>
                      <p>配置 OSS Bucket 接入</p>
                    </div>
                  </button>
                  <button className="storageHelpCard">
                    <span className="storageHelpIcon">🟡</span>
                    <div>
                      <strong>AWS S3</strong>
                      <p>配置 S3 Bucket 接入</p>
                    </div>
                  </button>
                  <button className="storageHelpCard">
                    <span className="storageHelpIcon">🔵</span>
                    <div>
                      <strong>Google Cloud</strong>
                      <p>配置 GCS Bucket 接入</p>
                    </div>
                  </button>
                  <button className="storageHelpCard">
                    <span className="storageHelpIcon">🖥️</span>
                    <div>
                      <strong>本地路径</strong>
                      <p>映射本地或 NFS 目录</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {mainTab === "public" && (
            <>
              <div className="subTabBar">
                {publicSubTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={subTab === tab.key ? "subTabItem active" : "subTabItem"}
                    onClick={() => setSubTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {subTab === "pub-dataset" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>公开数据集</h3>
                    <input placeholder="搜索公开数据集..." className="searchInput" />
                  </div>
                  <div className="pubGrid">
                    {pubDatasets.length === 0 && publicAssets.length === 0 && (
                      <div className="emptyState">暂无公开数据集</div>
                    )}
                    {(pubDatasets.length > 0 ? pubDatasets : publicAssets).map((asset) => (
                      <div className="pubCard" key={asset.id}>
                        <div className="pubCardHead">
                          <span className="pubIcon">📦</span>
                          <strong>{asset.name}</strong>
                          {asset.isOfficial && <span className="officialBadge">官方</span>}
                        </div>
                        <p className="pubDesc">{asset.description ?? "暂无描述"}</p>
                        <div className="pubMeta">
                          <span>模态：{asset.modality ?? "-"}</span>
                          <span>格式：{asset.format ?? "-"}</span>
                          <span>协议：{asset.license ?? "-"}</span>
                        </div>
                        <div className="pubFooter">
                          <span className="pubSource">来源：{asset.source ?? "-"}</span>
                          <button className="linkBtn">引用</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subTab === "pub-schema" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>公开 Schema</h3>
                    <input placeholder="搜索公开 Schema..." className="searchInput" />
                  </div>
                  <div className="pubGrid">
                    {schemaAssets.length === 0 && (
                      <div className="schemaCard">
                        <div className="schemaCardHead">
                          <span className="schemaIcon">📋</span>
                          <strong>COCO Detection Format</strong>
                          <span className="schemaFormat">JSON</span>
                        </div>
                        <div className="schemaBody">
                          <div className="schemaField">
                            <span>字段</span>
                            <strong>images, annotations, categories</strong>
                          </div>
                          <div className="schemaField">
                            <span>适用</span>
                            <strong>目标检测</strong>
                          </div>
                          <div className="schemaField">
                            <span>来源</span>
                            <strong>社区公开</strong>
                          </div>
                        </div>
                        <div className="schemaFooter">
                          <button className="linkBtn">查看 JSON</button>
                          <button className="linkBtn">引用</button>
                        </div>
                      </div>
                    )}
                    {schemaAssets.map((asset) => (
                      <div className="schemaCard" key={asset.id}>
                        <div className="schemaCardHead">
                          <span className="schemaIcon">📋</span>
                          <strong>{asset.name}</strong>
                          <span className="schemaFormat">{asset.format ?? "JSON"}</span>
                        </div>
                        <div className="schemaBody">
                          <div className="schemaField">
                            <span>描述</span>
                            <strong>{asset.description ?? "-"}</strong>
                          </div>
                          <div className="schemaField">
                            <span>来源</span>
                            <strong>{asset.source ?? "-"}</strong>
                          </div>
                          <div className="schemaField">
                            <span>协议</span>
                            <strong>{asset.license ?? "-"}</strong>
                          </div>
                        </div>
                        <div className="schemaFooter">
                          <button className="linkBtn">查看 JSON</button>
                          <button className="linkBtn">引用</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subTab === "pub-label" && (
                <div className="dataPanel">
                  <div className="dataPanelHead">
                    <h3>公开标签</h3>
                    <input placeholder="搜索公开标签..." className="searchInput" />
                  </div>
                  <div className="pubGrid">
                    {pubLabels.length === 0 && (
                      <>
                        <div className="pubCard">
                          <div className="pubCardHead">
                            <span className="pubIcon">🏷️</span>
                            <strong>COCO 80 类标签</strong>
                            <span className="officialBadge">官方</span>
                          </div>
                          <p className="pubDesc">COCO 目标检测标准 80 类标签定义</p>
                          <div className="pubMeta">
                            <span>类别数：80</span>
                            <span>格式：JSON</span>
                            <span>协议：CC-BY-4.0</span>
                          </div>
                          <div className="pubFooter">
                            <span className="pubSource">来源：COCO Consortium</span>
                            <button className="linkBtn">引用</button>
                          </div>
                        </div>
                        <div className="pubCard">
                          <div className="pubCardHead">
                            <span className="pubIcon">🏷️</span>
                            <strong>KITTI 标签集</strong>
                          </div>
                          <p className="pubDesc">自动驾驶场景标签定义，含车辆、行人、骑行者</p>
                          <div className="pubMeta">
                            <span>类别数：8</span>
                            <span>格式：TXT</span>
                            <span>协议：CC-BY-NC-SA</span>
                          </div>
                          <div className="pubFooter">
                            <span className="pubSource">来源：KITTI</span>
                            <button className="linkBtn">引用</button>
                          </div>
                        </div>
                      </>
                    )}
                    {pubLabels.map((asset) => (
                      <div className="pubCard" key={asset.id}>
                        <div className="pubCardHead">
                          <span className="pubIcon">🏷️</span>
                          <strong>{asset.name}</strong>
                          {asset.isOfficial && <span className="officialBadge">官方</span>}
                        </div>
                        <p className="pubDesc">{asset.description ?? "暂无描述"}</p>
                        <div className="pubMeta">
                          <span>格式：{asset.format ?? "-"}</span>
                          <span>协议：{asset.license ?? "-"}</span>
                        </div>
                        <div className="pubFooter">
                          <span className="pubSource">来源：{asset.source ?? "-"}</span>
                          <button className="linkBtn">引用</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
