import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [users, orgs, memberships, logs] = await Promise.all([
    prisma.user.findMany({ take: 20 }),
    prisma.organization.findMany({ take: 20 }),
    prisma.organizationMember.findMany({ take: 50, include: { organization: true } }),
    prisma.operationLog.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="agxPage">
      <div className="agxPageHeader">
        <h1>权限与审计</h1>
        <p>管理用户、组织和操作审计日志。</p>
      </div>

      <div className="agxRow">
        <div className="agxCard">
          <div className="agxCardHeader"><h3>用户</h3><span className="agxCardSub">{users.length} 个</span></div>
          <table className="agxTable">
            <thead><tr><th>姓名</th><th>邮箱</th><th>角色</th></tr></thead>
            <tbody>
              {users.length === 0 ? <tr><td colSpan={3} className="agxEmpty">暂无用户</td></tr> : users.map((user) => (
                <tr key={user.id}>
                  <td className="agxPrimary">{user.name}</td>
                  <td className="agxMuted">{user.email}</td>
                  <td><span className="agxTag">{memberships.find((item) => item.userId === user.id)?.role || "-"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="agxCard">
          <div className="agxCardHeader"><h3>组织</h3><span className="agxCardSub">{orgs.length} 个</span></div>
          <table className="agxTable">
            <thead><tr><th>名称</th><th>类型</th><th>成员数</th></tr></thead>
            <tbody>
              {orgs.length === 0 ? <tr><td colSpan={3} className="agxEmpty">暂无组织</td></tr> : orgs.map((org) => (
                <tr key={org.id}>
                  <td className="agxPrimary">{org.name}</td>
                  <td><span className="agxTag">{org.type}</span></td>
                  <td>{memberships.filter((item) => item.organizationId === org.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="agxCard" style={{ marginTop: 14 }}>
        <div className="agxCardHeader"><h3>审计日志</h3><span className="agxCardSub">{logs.length} 条</span></div>
        <table className="agxTable">
          <thead><tr><th>操作</th><th>详情</th><th>角色</th><th>时间</th></tr></thead>
          <tbody>
            {logs.length === 0 ? <tr><td colSpan={4} className="agxEmpty">暂无日志</td></tr> : logs.map((log) => (
              <tr key={log.id}>
                <td className="agxPrimary">{log.action}</td>
                <td>{log.detail || "-"}</td>
                <td><span className="agxTag">{log.actorRole || log.userId || "-"}</span></td>
                <td className="agxMuted">{log.createdAt.toLocaleString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
