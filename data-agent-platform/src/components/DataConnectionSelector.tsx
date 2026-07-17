"use client";

import { useEffect, useState } from "react";

interface CloudConnection {
  id: string;
  name: string;
  type: "OWN_CLOUD" | "THIRD_PARTY";
}

interface BucketInfo {
  name: string;
  size: number;
  objectCount: number;
}

interface StorageObject {
  key: string;
  name: string;
  type: "file" | "folder";
  size: number;
  updatedAt: string;
}

export default function DataConnectionSelector() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConn, setSelectedConn] = useState<CloudConnection | null>(null);
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [browsing, setBrowsing] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"assets" | "cloud">("assets");

  useEffect(() => {
    fetch("/api/cloud-connections")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setConnections(data.connections);
          if (data.connections.length > 0) {
            setSelectedConn(data.connections[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConn) return;
    fetch(`/api/cloud-connections/buckets?provider=${selectedConn.type}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBuckets(data.buckets);
          setSelectedBucket(data.buckets[0]?.name || "");
        }
      });
  }, [selectedConn]);

  useEffect(() => {
    if (!selectedConn || !selectedBucket) return;
    loadObjects(selectedConn.type, selectedBucket, prefix);
  }, [selectedBucket, prefix]);

  async function loadObjects(provider: string, bucket: string, prefix: string) {
    setBrowsing(true);
    try {
      const res = await fetch(
        `/api/cloud-connections/objects?provider=${provider}&bucket=${bucket}&prefix=${prefix}`
      );
      const data = await res.json();
      if (data.success) {
        setObjects(data.objects);
        setSelectedKeys(new Set());
      }
    } finally {
      setBrowsing(false);
    }
  }

  function toggleKey(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  }

  function enterFolder(key: string) {
    setPrefix(key);
  }

  function goUp() {
    if (!prefix) return;
    const parts = prefix.replace(/\/$/, "").split("/");
    parts.pop();
    setPrefix(parts.length > 0 ? parts.join("/") + "/" : "");
  }

  const quickAssets = [
    { id: "vehicle-6996", name: "城市道路样例图像", count: 6996, format: "jpg", icon: "🚗" },
    { id: "coco-500", name: "COCO 车辆公开样例", count: 500, format: "COCO JSON", icon: "📚" },
    { id: "waste-300", name: "校园垃圾分类样例", count: 300, format: "jpg", icon: "♻️" },
    { id: "ocr-120", name: "OCR 票据样例", count: 120, format: "image+txt", icon: "📄" },
  ];

  return (
    <div className="dataConnectionSelector">
      <div className="connSelectorHeader">
        <div className="connSelectorTabs">
          <button
            className={`connSelectorTab ${viewMode === "assets" ? "active" : ""}`}
            onClick={() => setViewMode("assets")}
          >
            <span className="connTabIcon">📁</span>
            <span className="connTabText">快捷资产</span>
          </button>
          <button
            className={`connSelectorTab ${viewMode === "cloud" ? "active" : ""}`}
            onClick={() => setViewMode("cloud")}
          >
            <span className="connTabIcon">☁️</span>
            <span className="connTabText">云存储</span>
          </button>
        </div>
      </div>

      {viewMode === "assets" ? (
        <div className="connSelectorContent">
          <div className="quickAssetGrid">
            {quickAssets.map((asset) => (
              <button
                key={asset.id}
                className="quickAssetCard"
              >
                <div className="quickAssetIcon">{asset.icon}</div>
                <div className="quickAssetInfo">
                  <strong>{asset.name}</strong>
                  <span>{asset.count} 条 / {asset.format}</span>
                </div>
                <div className="quickAssetSelect">
                  <span className="selectCheck">✓</span>
                </div>
              </button>
            ))}
          </div>
          <div className="connSelectorFooter">
            <span className="footerHint">已选择：城市道路样例图像 (6996 条)</span>
          </div>
        </div>
      ) : (
        <div className="connSelectorContent">
          {loading ? (
            <div className="connLoading">加载连接中...</div>
          ) : connections.length === 0 ? (
            <div className="connEmpty">
              <span className="connEmptyIcon">🔗</span>
              <p>暂无云存储连接</p>
              <span>请先到「设置中心 → 云存储接入」添加公司云或第三方云连接凭证</span>
            </div>
          ) : (
            <div className="cloudSelectorLayout">
              <aside className="cloudConnList">
                {connections.map((conn) => (
                  <button
                    key={conn.id}
                    className={`cloudConnItem ${selectedConn?.id === conn.id ? "active" : ""}`}
                    onClick={() => { setSelectedConn(conn); setPrefix(""); }}
                  >
                    <span className="cloudConnIcon">{conn.type === "OWN_CLOUD" ? "🏢" : "☁️"}</span>
                    <div className="cloudConnInfo">
                      <strong>{conn.name}</strong>
                      <span>{conn.type === "OWN_CLOUD" ? "公司自有云" : "第三方云存储"}</span>
                    </div>
                  </button>
                ))}
              </aside>

              <div className="cloudBrowserArea">
                {selectedConn && buckets.length > 0 ? (
                  <>
                    <div className="cloudToolbar">
                      <div className="cloudBucketSelector">
                        <label>Bucket</label>
                        <select
                          value={selectedBucket}
                          onChange={(e) => { setSelectedBucket(e.target.value); setPrefix(""); }}
                        >
                          {buckets.map((b) => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="cloudPath">
                        <button onClick={() => setPrefix("")}>根目录</button>
                        {prefix && (
                          <>
                            <span>/</span>
                            <span className="cloudPathCurrent">{prefix.replace(/\/$/, "")}</span>
                          </>
                        )}
                      </div>
                      {prefix && (
                        <button className="cloudUpBtn" onClick={goUp}>⬆ 上一级</button>
                      )}
                    </div>

                    <div className="cloudFileList">
                      {browsing ? (
                        <div className="cloudFileLoading">加载中...</div>
                      ) : objects.length === 0 ? (
                        <div className="cloudFileEmpty">暂无文件</div>
                      ) : (
                        objects.map((obj) => (
                          <div key={obj.key} className="cloudFileItem">
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(obj.key)}
                              onChange={() => toggleKey(obj.key)}
                              disabled={obj.type === "folder"}
                            />
                            <span
                              className={`cloudFileIcon ${obj.type}`}
                              onClick={() => obj.type === "folder" && enterFolder(obj.key)}
                            >
                              {obj.type === "folder" ? "📁" : "📄"}
                            </span>
                            <span className="cloudFileName">{obj.name}</span>
                            <span className="cloudFileSize">
                              {obj.type === "file" ? formatSize(obj.size) : "-"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="cloudEmptyState">
                    <span className="cloudEmptyIcon">📂</span>
                    <p>选择一个云连接查看 Bucket</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}