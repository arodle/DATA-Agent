import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "运营审核中",
  SELF_RUNNING: "用户自执行",
  TOOL_RUNNING: "工具执行中",
  AGENT_RUNNING: "Agent执行中",
  SUPPLIER_RUNNING: "执行中",
  IN_PROGRESS: "进行中",
  ACCEPTANCE: "验收中",
  COMPLETED: "已完成",
  PAUSED: "已暂停",
  CANCELLED: "已取消",
};

const flowSteps = ["创建任务", "审核任务", "执行任务", "验收任务"];

function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString("zh-CN") : "-";
}

function formatTime(date?: Date | null) {
  if (!date) return "-";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}

function shortCode(code: string) {
  return code.replace(/^PRJ-/, "");
}

function currentFlowIndex(status: string) {
  if (["DRAFT", "PENDING_REVIEW"].includes(status)) return 1;
  if (["SELF_RUNNING", "TOOL_RUNNING", "AGENT_RUNNING", "SUPPLIER_RUNNING", "IN_PROGRESS"].includes(status)) return 2;
  if (status === "ACCEPTANCE") return 3;
  if (status === "COMPLETED") return 4;
  return 1;
}

type PageProps = {
  params: Promise<{ code: string }>;
};

export const dynamic = "force-dynamic";

export default async function OperatorProjectDetailPage({ params }: PageProps) {
  const { code } = await params;

  const project = await prisma.project.findFirst({
    where: { code },
    include: {
      creator: true,
      operator: true,
      ownerOrg: true,
      requirement: true,
      tasks: { orderBy: { createdAt: "asc" }, include: { supplier: { include: { organization: true } } } },
      datasets: { orderBy: { createdAt: "asc" } },
      toolConfigs: { orderBy: { createdAt: "desc" } },
      agentSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 12 },
          actions: { orderBy: { createdAt: "asc" }, take: 8 },
        },
      },
      operationLogs: { orderBy: { createdAt: "desc" }, take: 18, include: { user: true } },
      qualityEvents: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!project) notFound();

  const mainTask = project.tasks[0];
  const currentSession = project.agentSessions[0];
  const totalFiles = mainTask?.dataVolume || project.datasets.reduce((sum, item) => sum + (item.itemCount || 0), 0) || 0;
  const flowIndex = currentFlowIndex(project.executionStatus);
  const logsAscending = [...project.operationLogs].reverse();
  const firstLog = logsAscending[0];
  const acceptanceLog = project.operationLogs.find((log) => ["APPROVE_ACCEPTANCE", "REJECT_ACCEPTANCE"].includes(log.action));
  const openQualityCount = project.qualityEvents.filter((event) => event.status === "OPEN").length;
  const requirementDocName = project.requirement?.rawDocumentUrl?.split("/").pop() || "default-requirement-v1.pdf";

  const timeline = [
    {
      title: project.executionStatus === "ACCEPTANCE" ? "验收中" : statusLabel[project.executionStatus] || project.executionStatus,
      time: formatTime(acceptanceLog?.createdAt || project.updatedAt),
      active: true,
      details: [
        `审核合格率：${openQualityCount > 0 ? "待复核" : "100%"}`,
        `已验收文件：${project.executionStatus === "ACCEPTANCE" ? Math.min(totalFiles, 28) : totalFiles} / ${totalFiles || "-"}`,
        `验收合格率：${openQualityCount > 0 ? "待确认" : "100%"}`,
      ],
      links: ["下载", "查看"],
    },
    { title: "完成标注", time: formatTime(project.updatedAt), details: [`任务状态：${statusLabel[project.executionStatus] || project.executionStatus}`] },
    { title: "任务审核：通过", time: formatTime(project.updatedAt), details: [`操作人：${project.operator?.name || project.creator?.name || "operator"}`] },
    { title: "运营调整完成时间", time: formatTime(project.updatedAt), details: [`操作人：${project.operator?.name || "operator"}，从 ${formatDate(project.startDate)} 修改至 ${formatDate(project.expectedEndDate)}`] },
    { title: "文件上传成功", time: formatTime(firstLog?.createdAt || project.createdAt), details: [project.datasets[0]?.name || requirementDocName] },
    { title: "创建任务", time: formatTime(project.createdAt), details: [`操作人：${project.creator?.name || project.creator?.email || "-"}`] },
  ];

  return (
    <div className="taskDetailShell">
      <aside className="taskDetailAside">
        <div className="taskDetailAsideTop">
          <Link href="/operator/annotation" className="taskBack">‹</Link>
          <span className="taskSourceTag">内部任务</span>
          <strong>{shortCode(project.code)}——{project.name}</strong>
        </div>

        <div className="taskDetailAsideScroll">
        <section className="taskInfoSection">
          <h3>预期效果</h3>
          <a>看任务文档</a>
        </section>

        <section className="taskInfoSection">
          <h3>基础信息</h3>
          <dl>
            <dt>任务名称：</dt><dd>{shortCode(project.code)}——{project.name}</dd>
            <dt>任务ID：</dt><dd>{project.id.slice(-8)}</dd>
            <dt>任务来源：</dt><dd>{project.mode === "COLLECTION" ? "内部" : project.mode}</dd>
            <dt>预计费用：</dt><dd>{project.budgetAmount ? `${project.budgetAmount}` : "-"}</dd>
            <dt>费用名称：</dt><dd><a>{project.budgetName || project.name}</a></dd>
            <dt>费用ID：</dt><dd>{project.budgetName ? project.code : "-"}</dd>
            <dt>费用类型：</dt><dd>预算单</dd>
            <dt>创建人：</dt><dd>{project.creator?.name || project.creator?.email || "-"}</dd>
            <dt>用户端类型：</dt><dd>{project.requirement?.demandType || "SenseBee"}</dd>
            <dt>客户信息：</dt><dd>{project.companyName || project.ownerOrg?.name || "-"}</dd>
            <dt>期望完成时间：</dt><dd>{formatDate(project.expectedEndDate)}</dd>
            <dt>任务描述文档：</dt><dd><a>{requirementDocName}</a></dd>
            <dt>合格率要求：</dt><dd>{project.requirement?.acceptanceCriteria || "97%"}</dd>
            <dt>标注中下载：</dt><dd>是</dd>
          </dl>
        </section>

        <section className="taskInfoSection">
          <h3>运营信息</h3>
          <dl>
            <dt>运营人员：</dt><dd>{project.operator?.name || project.operator?.email || "待分配"}</dd>
            <dt>协助运营：</dt><dd>未填写</dd>
            <dt>任务账单：</dt><dd><a>查看详情</a></dd>
          </dl>
        </section>

        <section className="taskInfoSection">
          <h3>标注信息</h3>
          <dl>
            <dt>任务步骤定义：</dt><dd>{mainTask ? `1 - ${mainTask.stage}` : "1 - 标注"}</dd>
            <dt>当前状态：</dt><dd>{statusLabel[project.executionStatus] || project.executionStatus}</dd>
            <dt>文件数量：</dt><dd>{totalFiles || "-"}</dd>
          </dl>
        </section>

        <section className="taskInfoSection">
          <h3>数据信息</h3>
          <dl>
            <dt>数据类别：</dt><dd>{project.requirement?.dataModality || project.datasets[0]?.modality || "图片"}</dd>
            <dt>数据敏感：</dt><dd>{project.requirement?.safetyRequirement || "否"}</dd>
            <dt>存储类型：</dt><dd>{project.datasets[0]?.source || "SenseCore 专有云"}</dd>
            <dt>区域/集群：</dt><dd>{project.datasets[0]?.storagePath || "AOSS-v1"}</dd>
          </dl>
        </section>

        <div className="taskAsideActions">
          <button>导出工作量</button>
          <button>复制任务</button>
        </div>
        </div>
      </aside>

      <main className="taskDetailMain">
        <div className="taskCrumb">全部任务 &gt; {shortCode(project.code)}——{project.name}</div>
        <div className="taskFlowTabs">
          <span className="active">任务流程</span>
          <span>供应商详情</span>
          <span>质量审核详情</span>
          <span>任务包详情</span>
        </div>

        <div className="taskFlowLine">
          {flowSteps.map((step, index) => (
            <div className="taskFlowStep" key={step}>
              <span className={index + 1 <= flowIndex ? "done" : ""}>{index + 1 < flowIndex ? "✓" : index + 1}</span>
              <strong>{step}</strong>
              {index < flowSteps.length - 1 && <i />}
            </div>
          ))}
        </div>

        <div className="taskTimeline">
          {timeline.map((item, index) => (
            <div className={`taskTimelineItem ${item.active ? "active" : ""}`} key={`${item.title}-${index}`}>
              <div className="taskTimelineTime">{item.time}</div>
              <div className="taskTimelineDot" />
              <div className="taskTimelineCard">
                <h4>{item.title}</h4>
                {item.details.map((detail) => <p key={detail}>{detail}</p>)}
                {item.links && <p className="taskTimelineLinks">请验收标注结果 <a>下载</a> <a>查看</a></p>}
              </div>
            </div>
          ))}
        </div>

        <section className="taskAgentPanel">
          <div className="taskPanelHead">
            <h3>Agent 协同记录</h3>
            <span>{currentSession ? currentSession.title || "会话" : "暂无会话"}</span>
          </div>
          <div className="taskAgentBody">
            {currentSession?.messages.length ? (
              currentSession.messages.map((message) => (
                <div className="taskAgentMessage" key={message.id}>
                  <strong>{message.role === "USER" ? "运营" : "Agent"}</strong>
                  <p>{message.content}</p>
                </div>
              ))
            ) : (
              <div className="taskAgentEmpty">暂无 Agent 互动记录。后续授权 Agent、配置工具、生成质检建议都会沉淀在这里。</div>
            )}
          </div>
          {currentSession?.actions.length ? (
            <div className="taskAgentActions">
              {currentSession.actions.map((action) => (
                <span key={action.id}>{action.actionType} · {action.status}</span>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}