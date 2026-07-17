"use client";

import { useEffect, useState } from "react";

type CloudType = "OWN_CLOUD" | "THIRD_PARTY";

const REGIONS = ["cn-hangzhou", "cn-beijing", "cn-shanghai", "cn-shenzhen", "us-east-1", "ap-northeast-1", "ap-southeast-1"];

const AUTH_METHODS = ["AccessKey", "临时凭证 STS", "IAM 角色"];

export default function CloudStorageClient() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState<CloudType>("OWN_CLOUD");
  const [region, setRegion] = useState("");
  const [authMethod, setAuthMethod] = useState("AccessKey");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [endpoint, setEndpoint] = useState("");

  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    setLoading(true);
    try {
      const res = await fetch("/api/cloud-connections");
      const data = await res.json();
      if (data.success) setConnections(data.connections);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setType("OWN_CLOUD");
    setRegion("");
    setAuthMethod("AccessKey");
    setAccessKey("");
    setSecretKey("");
    setEndpoint("");
    setTestMsg(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/cloud-connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          provider: type,
          config: {
            region,
            authMethod,
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            endpoint,
          },
        }),
      });
      const data = await res.json();
      setTestMsg({ ok: data.success, text: data.message || data.error || "测试完成" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const providerLabel = type === "OWN_CLOUD" ? "公司自有云" : "第三方云存储";
      const res = await fetch("/api/cloud-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `${providerLabel}-${connections.filter(c => c.type === type).length + 1}`,
          type,
          provider: type,
          config: {
            region,
            authMethod,
            accessKeyId: accessKey ? `${accessKey.slice(0, 4)}****` : undefined,
            endpoint,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConnections([data.connection, ...connections]);
        setShowForm(false);
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = type === "OWN_CLOUD" ? "公司自有云" : "第三方云存储";

  return (
    <div className="cloudStorageClient">
      <div className="cloudStorageHeader">
        <div>
          <h3 className="sectionTitle">云存储接入</h3>
          <p className="cloudStorageDesc">管理云存储连接凭证。新建项目时再选择 Bucket 和路径。</p>
        </div>
        <button className="primaryBtn" onClick={() => { resetForm(); setShowForm(true); }}>
          + 添加连接
        </button>
      </div>

      {showForm && (
        <div className="cloudFormCard">
          <h4>添加云存储连接</h4>

          <div className="cloudFormGrid">
            <div className="formItem">
              <label>连接名称</label>
              <input
                type="text"
                placeholder="例如：华东标注数据云"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="formItem">
              <label>云类型</label>
              <div className="cloudTypeSelector">
                {[
                  { key: "OWN_CLOUD", label: "公司自有云" },
                  { key: "THIRD_PARTY", label: "第三方云存储" },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`cloudTypeBtn ${type === t.key ? "active" : ""}`}
                    onClick={() => setType(t.key as CloudType)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cloudFormGrid">
            {type === "OWN_CLOUD" ? (
              <>
                <div className="formItem">
                  <label>Endpoint</label>
                  <input
                    type="text"
                    placeholder="公司云服务地址（可选）"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                  <span className="formHint">公司云通常自动认证，无需密钥</span>
                </div>
              </>
            ) : (
              <>
                <div className="formItem">
                  <label>Region</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">选择区域</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="formItem">
                  <label>认证方式</label>
                  <select value={authMethod} onChange={(e) => setAuthMethod(e.target.value)}>
                    {AUTH_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="formItem">
                  <label>AccessKey / KeyId</label>
                  <input
                    type="text"
                    placeholder="LTAI****************"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                  />
                </div>
                <div className="formItem">
                  <label>SecretKey</label>
                  <input
                    type="password"
                    placeholder="请输入 SecretKey"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                  />
                </div>
                <div className="formItem">
                  <label>Endpoint</label>
                  <input
                    type="text"
                    placeholder="https://oss-example.com"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {testMsg && (
            <div className={`cloudTestMsg ${testMsg.ok ? "ok" : "err"}`}>
              {testMsg.ok ? "✓" : "✗"} {testMsg.text}
            </div>
          )}

          <div className="cloudFormActions">
            <button className="ghostBtn" onClick={() => setShowForm(false)}>取消</button>
            <button className="ghostBtn" onClick={handleTest} disabled={testing}>
              {testing ? "测试中..." : "测试连接"}
            </button>
            <button className="primaryBtn" onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存连接"}
            </button>
          </div>
        </div>
      )}

      <div className="cloudConnectionList">
        {loading ? (
          <p className="cloudEmpty">加载中...</p>
        ) : connections.length === 0 ? (
          <p className="cloudEmpty">暂无云存储连接，点击右上角添加。</p>
        ) : (
          connections.map((conn) => (
            <div key={conn.id} className="cloudConnectionItem">
              <div className="cloudConnectionInfo">
                <span className="cloudProviderBadge">
                  {conn.type === "OWN_CLOUD" ? "🏢" : "☁️"} {conn.type === "OWN_CLOUD" ? "公司自有云" : "第三方云存储"}
                </span>
                <strong>{conn.name}</strong>
                <span className={`cloudStatus ${conn.status === "ACTIVE" ? "ok" : "err"}`}>
                  {conn.status === "ACTIVE" ? "已连接" : conn.status}
                </span>
              </div>
              <div className="cloudConnectionMeta">
                {conn.type === "THIRD_PARTY" && (
                  <>
                    <span>Region: {conn.config?.region || "-"}</span>
                    <span>Endpoint: {conn.config?.endpoint || "-"}</span>
                  </>
                )}
                {conn.type === "OWN_CLOUD" && conn.config?.endpoint && (
                  <span>Endpoint: {conn.config.endpoint}</span>
                )}
                <span>创建: {new Date(conn.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cloudStorageTip">
        <span className="tipIcon">💡</span>
        <p>Bucket 和路径在新建项目时选择。一个云连接可被多个项目共享使用。</p>
      </div>
    </div>
  );
}