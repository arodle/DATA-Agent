"use client";

import { useState } from "react";

export default function RagTester() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);

  const handleTest = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const start = Date.now();
    const res = await fetch("/api/agent-console/rag/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK: 5 }),
    });
    const data = await res.json();
    setTime(Date.now() - start);
    setResults(data.results || []);
    setLoading(false);
  };

  return (
    <div className="agxCard">
      <div className="agxCardHeader">
        <h3>检索测试</h3>
        <span className="agxCardSub">输入查询词测试RAG检索效果</span>
      </div>
      <div className="agxCardBody">
        <div className="agxSearchBar">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
            placeholder="例如：人体姿态标注规则"
          />
          <button className="agxBtnPrimary" onClick={handleTest} disabled={loading}>
            {loading ? "检索中..." : "测试检索"}
          </button>
        </div>
        {results.length > 0 && (
          <div className="agxSearchResults">
            <div className="agxSearchMeta">
              命中 {results.length} 条，耗时 {time}ms
            </div>
            {results.map((r) => (
              <div key={r.id} className="agxSearchItem">
                <div className="agxSearchScore">{r.score.toFixed(2)}</div>
                <div>
                  <div className="agxSearchTitle">{r.title}</div>
                  <div className="agxSearchPreview">{r.snippet}</div>
                  <div className="agxSearchMeta">
                    <span className="agxTag">{r.type}</span>
                    {r.category && <span className="agxMuted">{r.category}</span>}
                    {r.relations && <span className="agxMuted">{r.relations.length} 个关联</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}