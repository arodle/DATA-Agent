"use client";

import { useEffect, useState } from "react";

const REGIONS = ["cn-hangzhou", "cn-beijing", "cn-shanghai", "cn-shenzhen", "us-east-1", "ap-northeast-1", "ap-southeast-1"];

function formatBytes(bytes: number) {
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

export default function CloudStorageBrowser() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnId, setSelectedConnId] = useState<string>("");
  const [buckets, setBuckets] = useState<string[]>([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<any[]>([]);
  const [browsing, setBrowsing] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const selectedConn = connections.find(c => c.id === selectedConnId);

  useEffect(() => {
    fetch("/api/cloud-connections")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setConnections(data.connections);
          if (data.connections.length > 0) {
            setSelectedConnId(data.connections[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // load buckets when connection changes
  useEffect(() => {
    if (!selectedConn) return;
    fetch(`/api/cloud-connections/buckets?provider=${selectedConn.type}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBuckets(data.buckets);
          setSelectedBucket(data.buckets[0] || "");
        }
      });
  }, [selectedConnId]);

  // load objects when bucket or prefix changes
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

  async function handleImport() {
    if (selectedKeys.size === 0) return;
    setImporting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setImporting(false);
    alert(`已导入 ${selectedKeys.size} 个文件到数据资产元数据（演示）`);
    setSelectedKeys(new Set());
  }

  if (loading) return <p className="cloudEmpty">加载连接中...</p>;

  if (connections.length === 0) {
    return (
      <div className="cloudStorageEmpty">
        <span className="cloudEmptyIcon">☁️</span>
        <p>暂无云存储连接</p>
        <span>请先到「设置中心 → 云存储接入」添加公司云或第三方云连接凭证</span>
      </div>
    );
  }

  return (
    <div className="cloudBrowserLayout">
      <aside className="cloudBrowserSidebar">
        <h4>云连接</h4>
        {connections.map((conn) => (
          <button
            key={conn.id}
            className={`cloudBrowserConn ${selectedConnId === conn.id ? "active" : ""}`}
            onClick={() => { setSelectedConnId(conn.id); setPrefix(""); }}
          >
            <span className="cloudBrowserConnIcon">{conn.type === "OWN_CLOUD" ? "🏢" : "☁️"}</span>
            <div>
              <strong>{conn.name}</strong>
              <span>{conn.type === "OWN_CLOUD" ? "公司自有云" : "第三方云存储"}</span>
            </div>
          </button>
        ))}
      </aside>

      <div className="cloudBrowserMain">
        <div className="cloudBrowserToolbar">
          <div className="cloudBrowserSelectors">
            <div className="cloudSelectItem">
              <label>Bucket</label>
              <select value={selectedBucket} onChange={(e) => { setSelectedBucket(e.target.value); setPrefix(""); }}>
                {buckets.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="cloudSelectItem">
              <label>路径</label>
              <div className="cloudBreadcrumb">
                <button onClick={() => setPrefix("")} className={`cloudBreadcrumbRoot ${!prefix ? "active" : ""}`}>根目录</button>
                {prefix && (
                  <>
                    <span>/</span>
                    <span className="cloudBreadcrumbCurrent">{prefix.replace(/\/$/, "")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="cloudBrowserActions">
            {prefix && (
              <button className="ghostBtn" onClick={goUp}>⬆ 上一级</button>
            )}
            <button
              className="primaryBtn"
              disabled={selectedKeys.size === 0 || importing}
              onClick={handleImport}
            >
              {importing ? "导入中..." : `导入所选 (${selectedKeys.size})`}
            </button>
          </div>
        </div>

        <div className="cloudObjectTable">
          <div className="cloudObjectHead">
            <span className="cloudObjectCheck">选择</span>
            <span className="cloudObjectName">名称</span>
            <span className="cloudObjectType">类型</span>
            <span className="cloudObjectSize">大小</span>
            <span className="cloudObjectTime">更新时间</span>
          </div>

          {browsing ? (
            <div className="cloudObjectRow empty">加载中...</div>
          ) : objects.length === 0 ? (
            <div className="cloudObjectRow empty">暂无文件</div>
          ) : (
            objects.map((obj) => (
              <div key={obj.key} className="cloudObjectRow">
                <span className="cloudObjectCheck">
                  {obj.type === "file" && (
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(obj.key)}
                      onChange={() => toggleKey(obj.key)}
                    />
                  )}
                </span>
                <span
                  className={`cloudObjectName ${obj.type}`}
                  onClick={() => obj.type === "folder" && enterFolder(obj.key)}
                >
                  {obj.type === "folder" ? "📁" : "📄"} {obj.name}
                </span>
                <span className="cloudObjectType">{obj.type === "folder" ? "目录" : "文件"}</span>
                <span className="cloudObjectSize">{obj.type === "file" ? formatBytes(obj.size) : "-"}</span>
                <span className="cloudObjectTime">{new Date(obj.updatedAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}