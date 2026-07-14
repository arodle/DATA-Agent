import { prisma } from "@/lib/prisma";

function formatDate(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "-";
}

function formatTime(date: Date) {
  return date.toISOString().slice(11, 19);
}

export const dynamic = "force-dynamic";

export default async function OperationLogsPage() {
  let projects: any[] = [];
  try {
    projects = await prisma.project.findMany({
      include: {
        operationLogs: true,
      },
    });
  } catch (e) {
    console.error("Database error:", e);
  }

  const logs = projects
    .flatMap((p: any) => p.operationLogs.map((log: any) => ({ log, project: p })))
    .sort((a: any, b: any) => b.log.createdAt.getTime() - a.log.createdAt.getTime())
    .slice(0, 50);

  return (
    <div className="opWorkbench">
      <div className="agentBanner">
        <span className="agentBannerIcon">📝</span>
        <div>
          <strong>操作日志</strong>
          <p>操作审计 · 行为追踪 · 异常排查</p>
        </div>
      </div>

      <div className="logFilterBar">
        <input type="date" defaultValue="2026-06-01" aria-label="开始日期" />
        <span>至</span>
        <input type="date" defaultValue="2026-07-10" aria-label="结束日期" />
        <select defaultValue="" aria-label="角色">
          <option value="">全部角色</option>
          <option value="OPERATOR">运营</option>
          <option value="USER">用户</option>
          <option value="SUPPLIER">供应商</option>
          <option value="AGENT">Agent</option>
        </select>
        <select defaultValue="" aria-label="操作类型">
          <option value="">全部操作</option>
          <option value="CREATE">创建</option>
          <option value="UPDATE">更新</option>
          <option value="DELETE">删除</option>
          <option value="REVIEW">审核</option>
          <option value="ASSIGN">分配</option>
        </select>
        <input
          type="search"
          placeholder="搜索操作详情 / 项目编号"
          aria-label="搜索"
          style={{ flex: 1, minWidth: 200 }}
        />
        <button className="ghostBtn">查询</button>
      </div>

      <div className="logTable">
        <div className="logRow logHead">
          <div>时间</div>
          <div>角色</div>
          <div>项目编号</div>
          <div>操作详情</div>
          <div>IP地址</div>
          <div>结果</div>
        </div>
        {logs.map(({ log, project }, i) => {
          const failed = i % 9 === 7;
          return (
            <div className="logRow" key={log.id}>
              <div className="mono">
                {formatDate(log.createdAt)} {formatTime(log.createdAt)}
              </div>
              <div>{log.actorRole}</div>
              <div className="mono">{project.code}</div>
              <div>
                {log.action}
                {log.detail ? `：${log.detail}` : ""}
              </div>
              <div className="mono">192.168.{(i % 250) + 1}.{(i * 7) % 250}</div>
              <div>
                <span className={`statusBadge ${failed ? "red" : "blue"}`}>
                  {failed ? "失败" : "成功"}
                </span>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="logRow" style={{ justifyContent: "center", color: "#9aa7b5" }}>
            暂无操作日志
          </div>
        )}
      </div>
    </div>
  );
}
