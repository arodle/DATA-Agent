import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const text = {
  home: "\u9996\u9875",
  defaultUser: "\u5f20\u4e09",
  morning: "\u65e9\u4e0a\u597d",
  noon: "\u4e2d\u5348\u597d",
  afternoon: "\u4e0b\u5348\u597d",
  evening: "\u665a\u4e0a\u597d",
  todayTodo: "\u4eca\u65e5\u5f85\u529e",
  viewAll: "\u67e5\u770b\u5168\u90e8",
  myNeeds: "\u6211\u7684\u9700\u6c42",
  communicating: "\u6c9f\u901a\u4e2d",
  todayNew: "\u4eca\u65e5\u65b0\u589e",
  aiNewNeeds: "AI\u53d1\u73b0\u65b0\u9700\u6c42",
  myProjects: "\u6211\u7684\u9879\u76ee",
  annotationProjects: "\u6807\u6ce8\u7ba1\u7406",
  collectionProjects: "\u91c7\u96c6\u7ba1\u7406",
  todayDone: "\u4eca\u65e5\u5b8c\u6210",
  recent: "\u6700\u8fd1\u52a8\u6001",
  shortcuts: "\u5feb\u6377\u5165\u53e3",
  pendingReview: "\u5f85\u5ba1\u6838\u9700\u6c42",
  pendingReply: "\u5f85\u56de\u590d\u5ba2\u6237",
  pendingQuote: "\u5f85\u786e\u8ba4\u62a5\u4ef7",
  openException: "\u5f85\u5904\u7406\u5f02\u5e38",
  requirement: "\u9700\u6c42\u7ba1\u7406",
  annotation: "\u6807\u6ce8\u7ba1\u7406",
  collection: "\u91c7\u96c6\u7ba1\u7406",
  supplier: "\u4f9b\u5e94\u5546\u7ba1\u7406",
  finance: "\u8d39\u7528\u7ba1\u7406",
  noRecent: "\u6682\u65e0\u6700\u8fd1\u52a8\u6001",
  agentConfirmed: "Agent \u52a8\u4f5c\u5df2\u786e\u8ba4",
  aiFound: "AI \u8bc6\u522b\u51fa\u65b0\u7684",
};

const icons = {
  bell: "\uD83D\uDD14",
  wave: "\uD83D\uDC4B",
  chat: "\uD83D\uDCAC",
  clipboard: "\uD83D\uDCCB",
  camera: "\uD83D\uDCF7",
  people: "\uD83D\uDC65",
  money: "\uD83D\uDCB0",
};

function formatTime(date?: Date | null) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return text.morning;
  if (hour < 14) return text.noon;
  if (hour < 18) return text.afternoon;
  return text.evening;
}

function isToday(date?: Date | null) {
  if (!date) return false;
  const now = new Date();
  return new Date(date).toDateString() === now.toDateString();
}

function projectKind(project: any) {
  const stages = new Set((project.tasks ?? []).map((task: any) => task.stage));
  if (stages.has("ANNOTATION") || project.mode === "ANNOTATION") return "annotation";
  if (stages.has("COLLECTION") || project.mode === "COLLECTION") return "collection";
  return "other";
}

export default async function OperatorHomePage() {
  const session = await auth().catch(() => null);
  const currentUser = session?.user?.name || session?.user?.email || text.defaultUser;

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      ownerOrg: true,
      operator: true,
      tasks: true,
      qualityEvents: true,
      operationLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      agentSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { actions: { orderBy: { createdAt: "desc" } } },
      },
    },
  });

  const pendingReview = projects.filter((project: any) => project.executionStatus === "PENDING_REVIEW").length;
  const pendingReply = projects.filter((project: any) => project.agentSessions[0]?.actions?.some((action: any) => action.status === "PREVIEW")).length;
  const pendingQuote = projects.filter((project: any) => !project.budgetAmount || project.executionStatus === "DRAFT").length;
  const openExceptions = projects.filter((project: any) => project.qualityEvents.some((event: any) => event.status === "OPEN")).length;
  const highPriority = projects.filter((project: any) => project.priority === "HIGH" || project.currentRisk === "HIGH").length;
  const todayWork = pendingReview + pendingReply + pendingQuote + openExceptions;

  const annotationProjects = projects.filter((project: any) => projectKind(project) === "annotation").length;
  const collectionProjects = projects.filter((project: any) => projectKind(project) === "collection").length;
  const completedToday = projects.filter((project: any) => project.executionStatus === "COMPLETED" && isToday(project.updatedAt)).length;
  const todayNew = projects.filter((project: any) => isToday(project.createdAt)).length;
  const aiDiscovered = projects.filter((project: any) => project.agentSessions.length > 0).length;
  const inCommunication = projects.filter((project: any) => ["DRAFT", "PENDING_REVIEW", "SELF_RUNNING"].includes(project.executionStatus)).length;

  const recentActivities = projects
    .flatMap((project: any) => {
      const org = project.ownerOrg?.name || project.companyName || project.name;
      const latestAction = project.agentSessions[0]?.actions?.[0];
      const actionActivity = latestAction
        ? [{
            id: `action-${latestAction.id}`,
            time: latestAction.createdAt,
            org,
            text: `${text.aiFound} ${latestAction.actionType}`,
            href: `/operator/projects/${project.code}`,
          }]
        : [];
      const logActivities = project.operationLogs.map((log: any) => ({
        id: log.id,
        time: log.createdAt,
        org,
        text: log.action === "AUTHORIZE_AGENT_ACTION" ? text.agentConfirmed : log.action,
        href: `/operator/projects/${project.code}`,
      }));
      return [...actionActivity, ...logActivities];
    })
    .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 4);

  const todoItems = [
    { tone: "red", label: text.pendingReview, count: pendingReview, href: "/operator/annotation?status=PENDING_REVIEW" },
    { tone: "yellow", label: text.pendingReply, count: pendingReply, href: "/operator/conversations" },
    { tone: "green", label: text.pendingQuote, count: pendingQuote, href: "/operator/finance" },
    { tone: "blue", label: text.openException, count: openExceptions, href: "/operator/quality" },
  ];

  return (
    <div className="operatorHomePage">
      <header className="operatorHomeTopbar">
        <Link href="/operator" className="operatorHomeLogo">Data Agent</Link>
        <strong>{text.home}</strong>
        <div className="operatorHomeUser">
          <span className="operatorBell">{icons.bell}<i>3</i></span>
          <span>{currentUser} &#9662;</span>
        </div>
      </header>

      <section className="operatorGreeting">
        <h1>{icons.wave} {greeting()}，{currentUser}</h1>
        <p>今天有 {todayWork} 个工作需要处理，其中 {highPriority} 个为高优先级。</p>
      </section>

      <section className="operatorHomePanel">
        <div className="operatorHomePanelHead">
          <h2>{text.todayTodo}</h2>
          <Link href="/operator/conversations">{text.viewAll}</Link>
        </div>
        <div className="operatorTodoRows">
          {todoItems.map((item) => (
            <Link href={item.href} className="operatorTodoRow" key={item.label}>
              <span className={`operatorTodoDot ${item.tone}`} />
              <strong>{item.label}</strong>
              <b>{item.count}</b>
              <i>&gt;</i>
            </Link>
          ))}
        </div>
      </section>

      <div className="operatorHomeCards">
        <section className="operatorMiniCard">
          <h2>{text.myNeeds}</h2>
          <div><span>{text.communicating}</span><strong>{inCommunication}</strong></div>
          <div><span>{text.todayNew}</span><strong>{todayNew}</strong></div>
          <div><span>{text.aiNewNeeds}</span><strong>{aiDiscovered}</strong></div>
        </section>
        <section className="operatorMiniCard">
          <h2>{text.myProjects}</h2>
          <div><span>{text.annotationProjects}</span><strong>{annotationProjects}</strong></div>
          <div><span>{text.collectionProjects}</span><strong>{collectionProjects}</strong></div>
          <div><span>{text.todayDone}</span><strong>{completedToday}</strong></div>
        </section>
      </div>

      <section className="operatorHomePanel">
        <div className="operatorHomePanelHead">
          <h2>{text.recent}</h2>
          <Link href="/operator/logs">{text.viewAll}</Link>
        </div>
        <div className="operatorActivityRows">
          {recentActivities.map((item: any) => (
            <Link href={item.href} className="operatorActivityRow" key={item.id}>
              <time>{formatTime(item.time)}</time>
              <strong>{item.org}</strong>
              <span>{item.text}</span>
              <i>&gt;</i>
            </Link>
          ))}
          {recentActivities.length === 0 && <div className="operatorEmptyRow">{text.noRecent}</div>}
        </div>
      </section>
    </div>
  );
}