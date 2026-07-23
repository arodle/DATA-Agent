import { prisma } from "@/lib/db";
import RagTester from "./RagTester";

export const dynamic = "force-dynamic";

export default async function RagCenterPage() {
  const knowledge = await prisma.knowledge.findMany({ take: 100, include: { embedding: true } });
  const embeddings = await prisma.knowledgeEmbedding.findMany();
  const relations = await prisma.knowledgeRelation.count();

  const indexedCount = embeddings.filter((item) => item.embeddingStatus === "INDEXED").length;
  const pendingCount = embeddings.filter((item) => item.embeddingStatus === "PENDING" || item.embeddingStatus === "PROCESSING").length;
  const failedCount = embeddings.filter((item) => item.embeddingStatus === "FAILED").length;
  const totalChunks = embeddings.reduce((sum, item) => sum + item.chunkCount, 0);
  const vectorDim = embeddings.find((item) => item.vectorDimension)?.vectorDimension || 1536;
  const knowledgeByType = knowledge.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>RAG 检索中心</h1>
        <p>管理知识向量化、检索性能与命中情况。</p>
      </div>

      <div className="agxStatGrid agxStatGrid6">
        <div className="agxStat"><div className="agxStatLabel">知识总数</div><div className="agxStatValue">{knowledge.length}</div></div>
        <div className="agxStat"><div className="agxStatLabel">已索引</div><div className="agxStatValue good">{indexedCount}</div></div>
        <div className="agxStat"><div className="agxStatLabel">待处理</div><div className="agxStatValue warn">{pendingCount}</div></div>
        <div className="agxStat"><div className="agxStatLabel">失败</div><div className="agxStatValue bad">{failedCount}</div></div>
        <div className="agxStat"><div className="agxStatLabel">向量维度</div><div className="agxStatValue">{vectorDim}</div></div>
        <div className="agxStat"><div className="agxStatLabel">关系数</div><div className="agxStatValue">{relations}</div></div>
      </div>

      <div className="agxRow">
        <div className="agxCard">
          <div className="agxCardHeader"><h3>知识类型分布</h3></div>
          <div className="agxCardBody">
            {Object.entries(knowledgeByType).map(([type, count]) => (
              <div key={type} className="agxTypeRow">
                <span>{type}</span>
                <div className="agxBar" style={{ width: 200 }}><div className="agxBarFill" style={{ width: `${knowledge.length ? (count / knowledge.length) * 100 : 0}%` }} /></div>
                <span className="agxMuted">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <RagTester />
      </div>

      <div className="agxCard">
        <div className="agxCardHeader"><h3>知识索引列表</h3></div>
        <table className="agxTable">
          <thead><tr><th>标题</th><th>类型</th><th>分类</th><th>向量状态</th><th>分片数</th><th>更新</th></tr></thead>
          <tbody>
            {knowledge.map((item) => (
              <tr key={item.id}>
                <td className="agxPrimary">{item.title}</td>
                <td><span className="agxTag">{item.type}</span></td>
                <td>{item.category || "-"}</td>
                <td>{item.embedding ? <span className={`agxStatus ${item.embedding.embeddingStatus === "INDEXED" ? "ok" : item.embedding.embeddingStatus === "FAILED" ? "bad" : "warn"}`}>{item.embedding.embeddingStatus}</span> : <span className="agxMuted">未索引</span>}</td>
                <td>{item.embedding?.chunkCount || 0}</td>
                <td className="agxMuted">{item.embedding ? item.embedding.updatedAt.toLocaleDateString("zh-CN") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
