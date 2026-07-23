import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function KnowledgeAssetsPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; q?: string };
}) {
  const where: any = {};
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q } },
      { content: { contains: searchParams.q } },
    ];
  }

  const [knowledgeList, totalCount, typeStats, statusStats] = await Promise.all([
    prisma.knowledge.findMany({
      where,
      include: {
        relations: true,
        embedding: true,
        _count: { select: { relations: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.knowledge.count(),
    prisma.knowledge.groupBy({
      by: ["type"],
      _count: { id: true },
    }),
    prisma.knowledge.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>知识资产中心</h1>
        <p>管理已发布的知识资产，所有数据均来自业务数据库</p>
      </div>

      <div className="agxStatGrid agxStatGrid5">
        <div className="agxStat">
          <div className="agxStatLabel">知识总量</div>
          <div className="agxStatValue">{totalCount}</div>
        </div>
        {typeStats.map((t) => (
          <div key={t.type} className="agxStat">
            <div className="agxStatLabel">{t.type}</div>
            <div className="agxStatValue">{t._count.id}</div>
          </div>
        ))}
      </div>

      <div className="agxCard">
        <div className="agxCardHeader">
          <h3>知识列表</h3>
          <div className="agxFilterBar">
            <select className="agxSelect">
              <option>全部类型</option>
              <option>标注规则</option>
              <option>质量案例</option>
              <option>项目经验</option>
              <option>SOP流程</option>
              <option>数据经验</option>
            </select>
            <select className="agxSelect">
              <option>全部状态</option>
              <option>已发布</option>
              <option>待审核</option>
              <option>草稿</option>
            </select>
            <input className="agxInput" placeholder="搜索知识..." />
          </div>
        </div>
        <table className="agxTable">
          <thead>
            <tr>
              <th>标题</th>
              <th>类型</th>
              <th>状态</th>
              <th>可信度</th>
              <th>调用次数</th>
              <th>关联数</th>
              <th>向量状态</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            {knowledgeList.length === 0 ? (
              <tr>
                <td colSpan={8} className="agxEmpty">
                  暂无知识数据。请先在「<Link href="/operator/agent-console/knowledge/operation" className="agxLink">知识运营中心</Link>」创建知识。
                </td>
              </tr>
            ) : (
              knowledgeList.map((k) => (
                <tr key={k.id}>
                  <td className="agxPrimary">{k.title}</td>
                  <td><span className="agxTag">{k.type}</span></td>
                  <td>
                    <span className={`agxStatus ${k.status === "PUBLISHED" ? "ok" : k.status === "PENDING" ? "warn" : "draft"}`}>
                      {k.status === "PUBLISHED" ? "已发布" : k.status === "PENDING" ? "待审核" : "草稿"}
                    </span>
                  </td>
                  <td>
                    <div className="agxBar">
                      <div className="agxBarFill" style={{ width: `${k.confidence}%` }} />
                      <span>{k.confidence}%</span>
                    </div>
                  </td>
                  <td>{k.callCount}</td>
                  <td>{k._count.relations}</td>
                  <td>
                    {k.embedding ? (
                      <span className={`agxStatus ${k.embedding.embeddingStatus === "INDEXED" ? "ok" : "warn"}`}>
                        {k.embedding.embeddingStatus === "INDEXED" ? "已索引" : "待处理"}
                      </span>
                    ) : (
                      <span className="agxMuted">未索引</span>
                    )}
                  </td>
                  <td className="agxMuted">{new Date(k.updatedAt).toLocaleDateString("zh-CN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}