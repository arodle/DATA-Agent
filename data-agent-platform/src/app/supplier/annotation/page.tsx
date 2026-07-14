"use client";

import { useSupplierRole } from "../SupplierRoleContext";
import { useRouter } from "next/navigation";

interface ExecBatch {
  id: string;
  name: string;
  project: string;
  mode: "标注" | "采集";
  type: string;
  totalCount: number;
  claimedCount: number;
  completedCount: number;
  deadline: string;
  difficulty: string;
  status: "可领取" | "已领取" | "进行中" | "已完成";
}

const allBatches: ExecBatch[] = [
  { id: "BATCH-042", name: "车辆 2D 框质检与返修", project: "PRJ-001 自动驾驶", mode: "标注", type: "质检/返修", totalCount: 8000, claimedCount: 5, completedCount: 4880, deadline: "2026-07-15", difficulty: "中等", status: "进行中" },
  { id: "BATCH-043", name: "行人关键点标注", project: "PRJ-003 行人检测", mode: "标注", type: "标注", totalCount: 5000, claimedCount: 3, completedCount: 0, deadline: "2026-07-18", difficulty: "高", status: "已领取" },
  { id: "BATCH-044", name: "骑行人属性质检", project: "PRJ-001 自动驾驶", mode: "标注", type: "质检", totalCount: 3000, claimedCount: 2, completedCount: 2100, deadline: "2026-07-14", difficulty: "低", status: "进行中" },
  { id: "BATCH-045", name: "语音转写标注", project: "PRJ-004 语音识别", mode: "标注", type: "标注", totalCount: 3200, claimedCount: 4, completedCount: 2560, deadline: "2026-07-16", difficulty: "中等", status: "进行中" },
  { id: "BATCH-046", name: "交通场景分类标注", project: "PRJ-002 交通识别", mode: "标注", type: "标注", totalCount: 6000, claimedCount: 6, completedCount: 6000, deadline: "2026-07-10", difficulty: "低", status: "已完成" },
  { id: "BATCH-048", name: "夜间场景车辆检测", project: "PRJ-001 自动驾驶", mode: "标注", type: "标注", totalCount: 4000, claimedCount: 0, completedCount: 0, deadline: "2026-07-22", difficulty: "高", status: "可领取" },
  { id: "BATCH-049", name: "交通灯颜色标注", project: "PRJ-002 交通识别", mode: "标注", type: "标注", totalCount: 2500, claimedCount: 0, completedCount: 0, deadline: "2026-07-23", difficulty: "低", status: "可领取" },
  { id: "COL-001", name: "城区道路图像采集", project: "PRJ-001 自动驾驶", mode: "采集", type: "图像采集", totalCount: 5000, claimedCount: 3, completedCount: 3200, deadline: "2026-07-20", difficulty: "中等", status: "进行中" },
  { id: "COL-002", name: "夜间场景视频采集", project: "PRJ-001 自动驾驶", mode: "采集", type: "视频采集", totalCount: 3000, claimedCount: 2, completedCount: 1800, deadline: "2026-07-22", difficulty: "高", status: "进行中" },
  { id: "COL-003", name: "方言语音采集", project: "PRJ-004 语音识别", mode: "采集", type: "语音采集", totalCount: 8000, claimedCount: 4, completedCount: 5600, deadline: "2026-07-25", difficulty: "中等", status: "进行中" },
  { id: "COL-004", name: "停车场场景采集", project: "PRJ-002 交通识别", mode: "采集", type: "图像采集", totalCount: 2000, claimedCount: 0, completedCount: 0, deadline: "2026-07-28", difficulty: "低", status: "可领取" },
  { id: "COL-005", name: "户外广告牌采集", project: "PRJ-003 行人检测", mode: "采集", type: "图像采集", totalCount: 1500, claimedCount: 0, completedCount: 0, deadline: "2026-07-30", difficulty: "低", status: "可领取" },
];

export default function SupplierExecPage() {
  const { role } = useSupplierRole();
  const router = useRouter();

  const annotationBatches = allBatches.filter((b) => b.mode === "标注");
  const collectionBatches = allBatches.filter((b) => b.mode === "采集");

  const annotationProgress = Math.round(
    annotationBatches.reduce((s, b) => s + b.completedCount, 0) / annotationBatches.reduce((s, b) => s + b.totalCount, 0) * 100
  );
  const collectionProgress = Math.round(
    collectionBatches.reduce((s, b) => s + b.completedCount, 0) / collectionBatches.reduce((s, b) => s + b.totalCount, 0) * 100
  );

  const handleEnter = (batch: ExecBatch) => {
    router.push(`/supplier/annotation/${batch.id}`);
  };

  const renderRightBlock = (label: string, icon: string, mode: "标注" | "采集", batches: ExecBatch[]) => {
    const total = batches.length;
    const claimable = batches.filter((b) => b.status === "可领取").length;
    const active = batches.filter((b) => b.status === "进行中" || b.status === "已领取").length;
    const done = batches.filter((b) => b.status === "已完成").length;
    const progress = Math.round(
      batches.reduce((s, b) => s + b.completedCount, 0) / batches.reduce((s, b) => s + b.totalCount, 0) * 100
    );

    return (
      <div className="sModeBlock">
        <div className="sModeBlockHeader">
          <span className="sModeBlockIcon">{icon}</span>
          <span className="sModeBlockTitle">{label}</span>
        </div>
        <div className="sModeBlockStats">
          <div className="sModeStat">
            <span>总批次</span>
            <strong>{total}</strong>
          </div>
          <div className="sModeStat">
            <span>可领取</span>
            <strong style={{ color: "#1565c0" }}>{claimable}</strong>
          </div>
          <div className="sModeStat">
            <span>进行中</span>
            <strong style={{ color: "#e65100" }}>{active}</strong>
          </div>
          <div className="sModeStat">
            <span>已完成</span>
            <strong style={{ color: "#2e7d32" }}>{done}</strong>
          </div>
        </div>
        <div className="sModeBlockProgress">
          <div className="sProgressBar" style={{ width: "100%" }}>
            <div className="sProgressFill" style={{ width: `${progress}%` }} />
          </div>
          <span className="sModeProgressText">{progress}%</span>
        </div>
        <div className="sModeBlockList">
          {batches.slice(0, 3).map((b) => {
            const pct = b.totalCount > 0 ? Math.round(b.completedCount / b.totalCount * 100) : 0;
            return (
              <div className="sModeBlockItem" key={b.id} onClick={() => handleEnter(b)}>
                <div className="sModeBlockItemTop">
                  <span className="mono" style={{ fontSize: 11, color: "#697889" }}>{b.id}</span>
                  <span className="pill small" style={{
                    background: b.status === "可领取" ? "#e3f2fd" : b.status === "已完成" ? "#e8f5e9" : "#fff3e0",
                    color: b.status === "可领取" ? "#1565c0" : b.status === "已完成" ? "#2e7d32" : "#e65100",
                    fontSize: 10,
                  }}>{b.status}</span>
                </div>
                <strong style={{ fontSize: 12 }}>{b.name}</strong>
                <div className="sModeBlockItemMeta">
                  <span>{b.totalCount.toLocaleString()} 条</span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
          {batches.length > 3 && (
            <div className="sModeBlockMore" onClick={() => router.push("/supplier/annotation")}>
              查看全部 {batches.length} 个{mode}批次 →
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBatchRow = (batch: ExecBatch) => {
    const pct = batch.totalCount > 0 ? Math.round(batch.completedCount / batch.totalCount * 100) : 0;
    return (
      <div className="tableDataRow" key={batch.id} onClick={() => handleEnter(batch)} style={{ cursor: "pointer" }}>
        <div className="projectCode mono">{batch.id}</div>
        <div><strong>{batch.name}</strong></div>
        <div className="mono" style={{ color: "#697889" }}>{batch.project}</div>
        <div>
          <span className="pill small" style={{
            background: batch.mode === "标注" ? "#e3f2fd" : "#fce4ec",
            color: batch.mode === "标注" ? "#1565c0" : "#c62828",
            fontSize: 10,
          }}>{batch.mode}</span>
        </div>
        <div><span className="tinyTag">{batch.type}</span></div>
        <div className="mono">{batch.totalCount.toLocaleString()}</div>
        <div>
          <div className="sProgressBar">
            <div className="sProgressFill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontSize: 12, color: "#697889" }}>{pct}%</span>
        </div>
        <div>
          <span className="pill small" style={{
            background: batch.difficulty === "高" ? "#fce4ec" : batch.difficulty === "中等" ? "#fff3e0" : "#e8f5e9",
            color: batch.difficulty === "高" ? "#c62828" : batch.difficulty === "中等" ? "#e65100" : "#2e7d32",
          }}>{batch.difficulty}</span>
        </div>
        <div className="mono">{batch.deadline}</div>
        <div>
          <span className="pill small" style={{
            background: batch.status === "可领取" ? "#e3f2fd" : batch.status === "已完成" ? "#e8f5e9" : "#fff3e0",
            color: batch.status === "可领取" ? "#1565c0" : batch.status === "已完成" ? "#2e7d32" : "#e65100",
          }}>{batch.status}</span>
        </div>
        <div>
          <button className="linkBtn" onClick={(e) => { e.stopPropagation(); handleEnter(batch); }}>
            {batch.status === "可领取" ? "领取" : "进入"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">✏️</span>
        <div>
          <strong>标采执行</strong>
          <p>{role === "manager" ? "标注与采集任务全貌监控" : "领取标注或采集任务进入工作区执行"}</p>
        </div>
      </div>

      <div className="sExecLayout">
        <div className="sExecLeft">
          <div className="card">
            <div className="cardHeader">
              <h3 className="cardTitle">批次列表</h3>
              <div className="opTableActions">
                <input type="text" placeholder="搜索批次..." className="ghostBtn" style={{ width: 140 }} />
                <select className="ghostBtn">
                  <option>全部类型</option>
                  <option>标注</option>
                  <option>采集</option>
                </select>
                <select className="ghostBtn">
                  <option>全部状态</option>
                  <option>可领取</option>
                  <option>进行中</option>
                  <option>已完成</option>
                </select>
              </div>
            </div>
            <div className="cardBody noPadding">
              <div className="projectTable">
                <div className="tableHeadRow">
                  <div>编号</div>
                  <div>任务名称</div>
                  <div>所属项目</div>
                  <div>类型</div>
                  <div>任务模式</div>
                  <div>总量</div>
                  <div>进度</div>
                  <div>难度</div>
                  <div>截止</div>
                  <div>状态</div>
                  <div>操作</div>
                </div>
                {allBatches.map(renderBatchRow)}
              </div>
            </div>
          </div>
        </div>

        <div className="sExecRight">
          {renderRightBlock("标注任务", "🏷️", "标注", annotationBatches)}
          {renderRightBlock("采集任务", "📸", "采集", collectionBatches)}
        </div>
      </div>
    </div>
  );
}
