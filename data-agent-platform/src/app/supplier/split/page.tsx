"use client";

import { useState } from "react";
import { useSupplierRole } from "../SupplierRoleContext";

interface TeamSplit {
  teamName: string;
  assigned: number;
  leader: string;
  members: number;
  status: string;
}

const mockSplits: TeamSplit[] = [
  { teamName: "图像标注一组", assigned: 3500, leader: "赵六", members: 25, status: "已分配" },
  { teamName: "语音转写组", assigned: 2000, leader: "钱七", members: 18, status: "已分配" },
  { teamName: "质检组", assigned: 1000, leader: "孙八", members: 8, status: "待确认" },
];

const pendingTask = {
  id: "BATCH-047",
  name: "夜间场景目标检测标注",
  totalAmount: 8000,
  deadline: "2026-07-20",
};

export default function SupplierSplitPage() {
  const { role } = useSupplierRole();

  if (role === "worker") {
    return (
      <div className="sPage">
        <div className="agentBanner">
          <span className="agentBannerIcon">🔒</span>
          <div>
            <strong>无访问权限</strong>
            <p>任务拆分功能仅对供应商负责人开放</p>
          </div>
        </div>
        <div className="sEmptyState">
          <div className="sEmptyIcon">⛔</div>
          <p>您当前为员工角色，无权访问任务拆分模块</p>
          <p style={{ color: "#697889", fontSize: 13 }}>如需查看，请联系供应商负责人</p>
        </div>
      </div>
    );
  }

  const assignedTotal = mockSplits.reduce((s, t) => s + t.assigned, 0);
  const remaining = pendingTask.totalAmount - assignedTotal;

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">🔀</span>
        <div>
          <strong>任务拆分</strong>
          <p>将运营分配的任务拆分到各团队执行</p>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">待拆分任务</h3>
        </div>
        <div className="cardBody">
          <div className="sSplitBanner">
            <div className="sSplitBannerInfo">
              <strong>{pendingTask.id}</strong>
              <span>{pendingTask.name}</span>
            </div>
            <div className="sSplitBannerMeta">
              <span>总量：<strong>{pendingTask.totalAmount.toLocaleString()}</strong></span>
              <span>截止：<strong>{pendingTask.deadline}</strong></span>
              <span>已分配：<strong>{assignedTotal.toLocaleString()}</strong></span>
              <span>剩余：<strong className={remaining < 0 ? "dangerText" : ""}>{remaining.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">团队拆分方案</h3>
          <button className="primaryBtn">新增分配</button>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>团队名称</div>
              <div>负责人</div>
              <div>成员数</div>
              <div>分配量</div>
              <div>占比</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {mockSplits.map((split) => (
              <div className="tableDataRow" key={split.teamName}>
                <div><strong>{split.teamName}</strong></div>
                <div>{split.leader}</div>
                <div>{split.members} 人</div>
                <div className="mono">{split.assigned.toLocaleString()}</div>
                <div>
                  <div className="sProgressBar">
                    <div className="sProgressFill" style={{ width: `${split.assigned / pendingTask.totalAmount * 100}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#697889" }}>{Math.round(split.assigned / pendingTask.totalAmount * 100)}%</span>
                </div>
                <div>
                  <span className={`pill small ${split.status === "已分配" ? "" : "pending"}`}
                    style={{
                      background: split.status === "已分配" ? "#e8f5e9" : "#fff3e0",
                      color: split.status === "已分配" ? "#2e7d32" : "#e65100",
                    }}
                  >{split.status}</span>
                </div>
                <div>
                  <button className="linkBtn">编辑</button>
                  <button className="linkBtn">通知</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">拆分进度</h3>
        </div>
        <div className="cardBody">
          <div className="sProgressOverview">
            <div className="sProgressItem">
              <span className="sProgressLabel">已分配</span>
              <span className="sProgressValue" style={{ color: "#2e7d32" }}>{assignedTotal.toLocaleString()}</span>
            </div>
            <div className="sProgressItem">
              <span className="sProgressLabel">待确认</span>
              <span className="sProgressValue" style={{ color: "#e65100" }}>{mockSplits.filter((s) => s.status === "待确认").reduce((s, t) => s + t.assigned, 0).toLocaleString()}</span>
            </div>
            <div className="sProgressItem">
              <span className="sProgressLabel">未分配</span>
              <span className="sProgressValue">{remaining.toLocaleString()}</span>
            </div>
            <div className="sProgressItem">
              <span className="sProgressLabel">分配完成率</span>
              <span className="sProgressValue" style={{ fontSize: 20 }}>{Math.round(assignedTotal / pendingTask.totalAmount * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
