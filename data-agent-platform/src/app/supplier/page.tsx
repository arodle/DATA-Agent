"use client";

import { useSupplierRole } from "./SupplierRoleContext";
import { useState } from "react";

interface BatchTask {
  id: string;
  name: string;
  project: string;
  type: string;
  assigned: number;
  completed: number;
  deadline: string;
  status: "执行中" | "待启动" | "已完成" | "审核中";
}

const mockTasks: BatchTask[] = [
  { id: "BATCH-042", name: "车辆 2D 框质检与返修", project: "PRJ-001 自动驾驶", type: "质检/返修", assigned: 8000, completed: 4880, deadline: "2026-07-15", status: "执行中" },
  { id: "BATCH-043", name: "行人关键点标注", project: "PRJ-003 行人检测", type: "标注", assigned: 5000, completed: 0, deadline: "2026-07-18", status: "待启动" },
  { id: "BATCH-044", name: "骑行人属性质检", project: "PRJ-001 自动驾驶", type: "质检", assigned: 3000, completed: 2100, deadline: "2026-07-14", status: "执行中" },
  { id: "BATCH-045", name: "语音转写标注", project: "PRJ-004 语音识别", type: "标注", assigned: 3200, completed: 2560, deadline: "2026-07-16", status: "执行中" },
  { id: "BATCH-046", name: "交通场景分类标注", project: "PRJ-002 交通识别", type: "标注", assigned: 6000, completed: 6000, deadline: "2026-07-10", status: "已完成" },
];

const teamStats = {
  teams: 3,
  members: 51,
  online: 35,
  activeProjects: 4,
};

export default function SupplierTaskPage() {
  const { role, userName } = useSupplierRole();
  const [selectedTask, setSelectedTask] = useState<BatchTask | null>(null);

  const totalProgress = Math.round(
    mockTasks.reduce((s, t) => s + t.completed, 0) / mockTasks.reduce((s, t) => s + t.assigned, 0) * 100
  );

  if (!selectedTask) {
    return (
      <div className="sPage">
        <div className="agentBanner sBanner">
          <span className="agentBannerIcon">📋</span>
          <div>
            <strong>任务管理</strong>
            <p>{role === "manager" ? "团队任务分配与进度追踪" : "我的任务列表与领取"}</p>
          </div>
        </div>

        {role === "manager" && (
          <div className="workspaceStats">
            <div className="statCard">
              <span className="statIcon">👥</span>
              <div>
                <strong>{teamStats.members}</strong>
                <span>团队成员</span>
              </div>
            </div>
            <div className="statCard">
              <span className="statIcon">🟢</span>
              <div>
                <strong>{teamStats.online}</strong>
                <span>今日在线</span>
              </div>
            </div>
            <div className="statCard">
              <span className="statIcon">📁</span>
              <div>
                <strong>{teamStats.activeProjects}</strong>
                <span>进行中项目</span>
              </div>
            </div>
            <div className="statCard">
              <span className="statIcon">📈</span>
              <div>
                <strong>{totalProgress}%</strong>
                <span>整体进度</span>
              </div>
            </div>
          </div>
        )}

        {role === "worker" && (
          <div className="workspaceStats">
            <div className="statCard">
              <span className="statIcon">📋</span>
              <div>
                <strong>{mockTasks.filter((t) => t.status === "执行中").length}</strong>
                <span>进行中任务</span>
              </div>
            </div>
            <div className="statCard">
              <span className="statIcon">✅</span>
              <div>
                <strong>{mockTasks.filter((t) => t.status === "已完成").length}</strong>
                <span>已完成</span>
              </div>
            </div>
            <div className="statCard">
              <span className="statIcon">📊</span>
              <div>
                <strong>{totalProgress}%</strong>
                <span>完成率</span>
              </div>
            </div>
            <div className="statCard">
              <span className="statIcon">🏆</span>
              <div>
                <strong>96.8%</strong>
                <span>质检通过率</span>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="cardHeader">
            <h3 className="cardTitle">{role === "manager" ? "团队任务列表" : "我的任务列表"}</h3>
            <div className="opTableActions">
              <input type="text" placeholder="搜索任务批次..." className="ghostBtn" style={{ width: 180 }} />
              <select className="ghostBtn">
                <option>全部状态</option>
                <option>执行中</option>
                <option>待启动</option>
                <option>已完成</option>
              </select>
              {role === "manager" && <button className="primaryBtn">领取新任务</button>}
            </div>
          </div>
          <div className="cardBody noPadding">
            <div className="projectTable">
              <div className="tableHeadRow">
                <div>批次编号</div>
                <div>任务名称</div>
                <div>所属项目</div>
                <div>任务类型</div>
                <div>分配量</div>
                <div>完成量</div>
                <div>进度</div>
                <div>截止日期</div>
                <div>状态</div>
                <div>操作</div>
              </div>
              {mockTasks.map((task) => {
                const pct = task.assigned > 0 ? Math.round(task.completed / task.assigned * 100) : 0;
                return (
                  <div className="tableDataRow" key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: "pointer" }}>
                    <div className="projectCode mono">{task.id}</div>
                    <div><strong>{task.name}</strong></div>
                    <div className="mono" style={{ color: "#697889" }}>{task.project}</div>
                    <div><span className="tinyTag">{task.type}</span></div>
                    <div className="mono">{task.assigned.toLocaleString()}</div>
                    <div className="mono">{task.completed.toLocaleString()}</div>
                    <div>
                      <div className="sProgressBar">
                        <div className="sProgressFill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#697889" }}>{pct}%</span>
                    </div>
                    <div className="mono">{task.deadline}</div>
                    <div>
                      <span className={`pill small ${task.status === "执行中" ? "" : task.status === "已完成" ? "" : "pending"}`}
                        style={{
                          background: task.status === "执行中" ? "#e8f5e9" : task.status === "已完成" ? "#e3f2fd" : "#fff3e0",
                          color: task.status === "执行中" ? "#2e7d32" : task.status === "已完成" ? "#1565c0" : "#e65100",
                        }}
                      >{task.status}</span>
                    </div>
                    <div>
                      <button className="linkBtn" onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}>查看详情</button>
                      {role === "worker" && task.status === "待启动" && <button className="linkBtn" onClick={(e) => e.stopPropagation()}>领取</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sPage">
      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">{selectedTask.id} {selectedTask.name}</h3>
          <button className="ghostBtn" onClick={() => setSelectedTask(null)}>返回列表</button>
        </div>
        <div className="cardBody">
          <div className="sTaskDetail">
            <div className="sTaskInfo">
              <div className="sTaskInfoGrid">
                <div className="sTaskInfoItem">
                  <span className="sTaskLabel">所属项目</span>
                  <strong>{selectedTask.project}</strong>
                </div>
                <div className="sTaskInfoItem">
                  <span className="sTaskLabel">任务类型</span>
                  <strong>{selectedTask.type}</strong>
                </div>
                <div className="sTaskInfoItem">
                  <span className="sTaskLabel">分配量</span>
                  <strong>{selectedTask.assigned.toLocaleString()}</strong>
                </div>
                <div className="sTaskInfoItem">
                  <span className="sTaskLabel">已完成</span>
                  <strong>{selectedTask.completed.toLocaleString()}</strong>
                </div>
                <div className="sTaskInfoItem">
                  <span className="sTaskLabel">截止日期</span>
                  <strong>{selectedTask.deadline}</strong>
                </div>
                <div className="sTaskInfoItem">
                  <span className="sTaskLabel">状态</span>
                  <span className={`pill small ${selectedTask.status === "执行中" ? "" : "pending"}`}>{selectedTask.status}</span>
                </div>
              </div>
              <div className="sTaskProgressSection">
                <span className="sTaskLabel">总体进度</span>
                <div className="sProgressBar large">
                  <div className="sProgressFill" style={{ width: `${Math.round(selectedTask.completed / selectedTask.assigned * 100)}%` }} />
                </div>
                <strong className="sProgressText">{Math.round(selectedTask.completed / selectedTask.assigned * 100)}%</strong>
              </div>
            </div>
            <div className="sTaskActions">
              {role === "manager" && (
                <>
                  <button className="primaryBtn">分配任务</button>
                  <button className="ghostBtn">查看进度</button>
                  <button className="ghostBtn">导出报表</button>
                </>
              )}
              {role === "worker" && (
                <>
                  <button className="primaryBtn">进入工作区</button>
                  <button className="ghostBtn">提交结果</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
