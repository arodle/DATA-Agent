import Link from "next/link";

const navItems = [
  { label: "我的任务", active: true },
  { label: "批次执行" },
  { label: "规则文档" },
  { label: "质检反馈", badge: "6" },
  { label: "返修任务" },
  { label: "交付记录" },
  { label: "结算依据" },
];

const supplierStages = [
  { label: "接收任务", step: 1, done: true },
  { label: "执行/质检", step: 2, current: true },
  { label: "返修", step: 3 },
  { label: "提交", step: 4 },
];

const qualityIssues = [
  { id: "QINC-203", title: "漏标", status: "处理中", count: 23, tagType: "pending" },
  { id: "QINC-204", title: "框偏移", status: "已复检", count: 8, tagType: "blue" },
  { id: "QINC-205", title: "类别错误", status: "已关闭", count: 3, tagType: "" },
];

const batchTasks = [
  { id: "BATCH-042", name: "车辆 2D 框质检与返修", deadline: "07-12", status: "执行中" },
  { id: "BATCH-043", name: "行人关键点标注", deadline: "07-14", status: "待启动" },
  { id: "BATCH-044", name: "骑行人属性质检", deadline: "07-18", status: "待启动" },
];

export default function SupplierPage() {
  const selectedTask = batchTasks[0];
  const assignedCount = 8000;
  const completedPercent = 61;
  const reworkCount = 2;
  const passRate = "96.8%";

  return (
    <main className="roleShell supplierShell">
      <aside className="roleSidebar">
        <div className="roleBrand">Data Agent / 供应商</div>
        <nav className="roleNav">
          {navItems.map((item) => (
            <button className={item.active ? "roleNavItem active" : "roleNavItem"} key={item.label}>
              {item.label}
              {item.badge && <span className="navBadge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="roleSwitcher">
          <span>切换角色</span>
          <div className="roleLinks">
            <Link href="/user">用户</Link>
            <Link href="/operator">运营</Link>
            <Link href="/supplier" className="active">供应商</Link>
          </div>
        </div>
      </aside>

      <section className="roleWorkspace">
        <header className="roleTopbar">
          <div>
            <p className="crumb">供应商/质检视角 / 被分配任务</p>
            <h1>{selectedTask ? `${selectedTask.id} ${selectedTask.name}` : "我的任务列表"}</h1>
          </div>
          <div className="topbarRight">
            <span className="statusTag">任务受限可见</span>
            <button className="primaryBtn">提交批次</button>
          </div>
        </header>

        {selectedTask && (
          <>
            <section className="heroCard">
              <div className="heroInfo">
                <p className="crumb">我的批次 / {selectedTask.id}</p>
                <h2>{selectedTask.name}</h2>
                <span className="stateTag">执行中 / 仅可见被分配范围</span>
              </div>
              <div className="metricItem">
                <span>分配量</span>
                <strong>{assignedCount.toLocaleString()}</strong>
              </div>
              <div className="metricItem">
                <span>已完成</span>
                <strong>{completedPercent}%</strong>
              </div>
              <div className="metricItem dark">
                <span>返修数</span>
                <strong>{reworkCount}</strong>
              </div>
              <div className="metricItem">
                <span>质检通过</span>
                <strong>{passRate}</strong>
              </div>
            </section>

            <section className="stageLine">
              {supplierStages.map((stage) => (
                <div
                  className={stage.current ? "stage current" : stage.done ? "stage done" : "stage"}
                  data-step={stage.step}
                  key={stage.label}
                >
                  {stage.label}
                </div>
              ))}
            </section>

            <section className="roleGrid supplierGrid">
              <article className="rolePanel">
                <div className="panelHead">
                  <span>任务信息</span>
                  <small>受限</small>
                </div>
                <div className="panelBody">
                  <div className="infoGrid">
                    <div className="infoRow">
                      <span>批次ID</span>
                      <strong>BATCH-042</strong>
                    </div>
                    <div className="infoRow">
                      <span>任务类型</span>
                      <strong>质检 / 返修</strong>
                    </div>
                    <div className="infoRow">
                      <span>规则文档</span>
                      <strong className="linkText">RULE-2D-BBOX-V1.1</strong>
                    </div>
                    <div className="infoRow">
                      <span>可见范围</span>
                      <strong>被分配样本</strong>
                    </div>
                    <div className="infoRow">
                      <span>不可查看</span>
                      <strong className="dangerText">其他供应商、竞价、客户全量数据</strong>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>执行工作台</span>
                  <small>样本级</small>
                </div>
                <div className="terminalBox">
                  <p className="termSystem">[系统] 已加载 BATCH-042 样本范围。</p>
                  <p>[质检] 检查漏标、错标、框偏移。</p>
                  <p>[Agent] 提示：当前 23 个样本疑似漏标，请确认。</p>
                  <p className="termMuted">返修说明将同步给运营审核。</p>
                </div>
                <div className="commandLine">
                  <input placeholder="输入质检备注，例如：远距离骑行人漏标较多..." />
                  <button>提交</button>
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>质量事件</span>
                </div>
                <div className="panelBody">
                  {qualityIssues.map((issue) => (
                    <div className="queueItem" key={issue.id}>
                      <strong>{issue.id} {issue.title}</strong>
                      <span className={`tag ${issue.tagType}`}>{issue.status}</span>
                      <div className="queueMeta">
                        <span>影响 {issue.count} 张</span>
                      </div>
                      {issue.tagType === "pending" && (
                        <button className="authorizeBtn">提交返修说明</button>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="wideRow">
              <article className="rolePanel">
                <div className="panelHead">
                  <span>我的任务列表</span>
                </div>
                <div className="panelBody">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>批次ID</th>
                        <th>任务</th>
                        <th>截止</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchTasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.id}</td>
                          <td>{task.name}</td>
                          <td>{task.deadline}</td>
                          <td>
                            <span className={task.status === "执行中" ? "pill small" : "pill small pending"}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="rolePanel">
                <div className="panelHead">
                  <span>操作记录</span>
                </div>
                <div className="panelBody">
                  <div className="timeline">
                    <div className="timelineItem">
                      <i className="dot"></i>
                      <div>
                        <span>今天 11:30</span>
                        <strong>提交 QINC-203 返修说明</strong>
                      </div>
                    </div>
                    <div className="timelineItem">
                      <i className="dot"></i>
                      <div>
                        <span>今天 10:20</span>
                        <strong>查看 RULE-2D-BBOX-V1.1</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
