"use client";

import { useSupplierRole } from "../SupplierRoleContext";

const qualityMetrics = {
  overallPassRate: "97.8%",
  totalReviewCount: 5240,
  issueCount: 116,
  reworkRate: "2.2%",
};

const teamQualityData = [
  { team: "图像标注一组", passRate: "98.2%", reviewed: 2800, issues: 50, reworkRate: "1.8%", trend: "up" },
  { team: "语音转写组", passRate: "96.5%", reviewed: 1600, issues: 56, reworkRate: "3.5%", trend: "down" },
  { team: "质检组", passRate: "99.1%", reviewed: 840, issues: 10, reworkRate: "1.2%", trend: "up" },
];

const recentIssues = [
  { id: "QINC-203", title: "远距离目标漏标", severity: "high", status: "处理中", count: 23, team: "图像标注一组" },
  { id: "QINC-204", title: "框偏移超出阈值", severity: "medium", status: "已复检", count: 8, team: "图像标注一组" },
  { id: "QINC-205", title: "类别错误", severity: "low", status: "已关闭", count: 3, team: "语音转写组" },
  { id: "QINC-206", title: "音频截断不准确", severity: "high", status: "处理中", count: 15, team: "语音转写组" },
];

const workerFeedback = [
  { id: "F-001", task: "BATCH-042", sample: "IMG_004212.jpg", issue: "框偏移 8%", status: "待修改", feedback: "检测框未贴紧目标下边缘，请修正" },
  { id: "F-002", task: "BATCH-042", sample: "IMG_004215.jpg", issue: "漏标远距离行人", status: "已修改", feedback: "行人目标虽小但可见，需补充标注" },
  { id: "F-003", task: "BATCH-045", sample: "AUDIO_0034.wav", issue: "时间戳偏移", status: "待修改", feedback: "转写文本与音频时间戳不对齐" },
];

export default function SupplierQualityPage() {
  const { role } = useSupplierRole();

  if (role === "manager") {
    return (
      <div className="sPage">
        <div className="agentBanner sBanner">
          <span className="agentBannerIcon">📊</span>
          <div>
            <strong>质量分析</strong>
            <p>团队整体质量数据与各团队质量对比分析</p>
          </div>
        </div>

        <div className="workspaceStats">
          <div className="statCard">
            <span className="statIcon">✅</span>
            <div>
              <strong style={{ color: "#2e7d32" }}>{qualityMetrics.overallPassRate}</strong>
              <span>整体合格率</span>
            </div>
          </div>
          <div className="statCard">
            <span className="statIcon">📋</span>
            <div>
              <strong>{qualityMetrics.totalReviewCount.toLocaleString()}</strong>
              <span>质检总数</span>
            </div>
          </div>
          <div className="statCard">
            <span className="statIcon">⚠️</span>
            <div>
              <strong style={{ color: "#e65100" }}>{qualityMetrics.issueCount}</strong>
              <span>发现问题数</span>
            </div>
          </div>
          <div className="statCard">
            <span className="statIcon">🔄</span>
            <div>
              <strong>{qualityMetrics.reworkRate}</strong>
              <span>返修率</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <h3 className="cardTitle">各团队质量对比</h3>
            <select className="ghostBtn">
              <option>本周</option>
              <option>本月</option>
            </select>
          </div>
          <div className="cardBody noPadding">
            <div className="projectTable">
              <div className="tableHeadRow">
                <div>团队</div>
                <div>合格率</div>
                <div>质检数</div>
                <div>问题数</div>
                <div>返修率</div>
                <div>趋势</div>
                <div>操作</div>
              </div>
              {teamQualityData.map((t) => (
                <div className="tableDataRow" key={t.team}>
                  <div><strong>{t.team}</strong></div>
                  <div>
                    <span className="pill small"
                      style={{
                        background: parseFloat(t.passRate) >= 97 ? "#e8f5e9" : "#fff3e0",
                        color: parseFloat(t.passRate) >= 97 ? "#2e7d32" : "#e65100",
                      }}
                    >{t.passRate}</span>
                  </div>
                  <div className="mono">{t.reviewed.toLocaleString()}</div>
                  <div className="mono" style={{ color: "#e65100" }}>{t.issues}</div>
                  <div className="mono">{t.reworkRate}</div>
                  <div>{t.trend === "up" ? "📈 上升" : "📉 下降"}</div>
                  <div><button className="linkBtn">查看详情</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <h3 className="cardTitle">待处理质量问题</h3>
          </div>
          <div className="cardBody">
            {recentIssues.map((issue) => (
              <div className="queueItem" key={issue.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{issue.id} {issue.title}</strong>
                  <span className="pill small"
                    style={{
                      background: issue.severity === "high" ? "#fce4ec" : issue.severity === "medium" ? "#fff3e0" : "#e8f5e9",
                      color: issue.severity === "high" ? "#c62828" : issue.severity === "medium" ? "#e65100" : "#2e7d32",
                      fontSize: 10,
                    }}
                  >{issue.severity === "high" ? "高" : issue.severity === "medium" ? "中" : "低"}</span>
                  <span className="pill small"
                    style={{
                      background: issue.status === "处理中" ? "#e3f2fd" : issue.status === "已复检" ? "#f3e5f5" : "#e8f5e9",
                      color: issue.status === "处理中" ? "#1565c0" : issue.status === "已复检" ? "#7b1fa2" : "#2e7d32",
                    }}
                  >{issue.status}</span>
                </div>
                <div className="queueMeta">
                  <span>团队：{issue.team}</span>
                  <span>影响 {issue.count} 个样本</span>
                </div>
                {issue.status === "处理中" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button className="primaryBtn" style={{ height: 28, fontSize: 12 }}>下发返修</button>
                    <button className="ghostBtn" style={{ height: 28, fontSize: 12 }}>查看详情</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">💬</span>
        <div>
          <strong>质量反馈</strong>
          <p>个人标注质量反馈与修改建议</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">✅</span>
          <div>
            <strong style={{ color: "#2e7d32" }}>96.8%</strong>
            <span>个人合格率</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">📋</span>
          <div>
            <strong>1,240</strong>
            <span>已完成质检量</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">⚠️</span>
          <div>
            <strong style={{ color: "#e65100" }}>3</strong>
            <span>待修改</span>
          </div>
        </div>
        <div className="statCard">
          <span className="statIcon">🏆</span>
          <div>
            <strong style={{ color: "#2e7d32" }}>A</strong>
            <span>质量等级</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">个人质量反馈列表</h3>
          <select className="ghostBtn">
            <option>全部批次</option>
            <option>BATCH-042</option>
            <option>BATCH-045</option>
          </select>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>反馈编号</div>
              <div>批次</div>
              <div>样本</div>
              <div>问题描述</div>
              <div>质检反馈</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {workerFeedback.map((fb) => (
              <div className="tableDataRow" key={fb.id}>
                <div className="mono">{fb.id}</div>
                <div className="mono">{fb.task}</div>
                <div className="mono">{fb.sample}</div>
                <div>{fb.issue}</div>
                <div style={{ color: "#697889", fontSize: 12 }}>{fb.feedback}</div>
                <div>
                  <span className="pill small"
                    style={{
                      background: fb.status === "待修改" ? "#fce4ec" : "#e8f5e9",
                      color: fb.status === "待修改" ? "#c62828" : "#2e7d32",
                    }}
                  >{fb.status}</span>
                </div>
                <div>
                  {fb.status === "待修改" && <button className="primaryBtn" style={{ height: 28, fontSize: 12 }}>去修改</button>}
                  {fb.status === "已修改" && <span className="mono" style={{ color: "#697889" }}>已处理</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
