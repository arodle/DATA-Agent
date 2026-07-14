"use client";

import { useSupplierRole } from "../SupplierRoleContext";
import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
  status: "online" | "offline" | "busy";
  todayTasks: number;
  completed: number;
  quality: string;
}

const teams = [
  {
    id: "T001",
    name: "图像标注一组",
    leader: "赵六",
    memberCount: 25,
    activeCount: 22,
    onlineToday: 18,
    projectCount: 3,
  },
  {
    id: "T002",
    name: "语音转写组",
    leader: "钱七",
    memberCount: 18,
    activeCount: 15,
    onlineToday: 12,
    projectCount: 2,
  },
  {
    id: "T003",
    name: "质检组",
    leader: "孙八",
    memberCount: 8,
    activeCount: 7,
    onlineToday: 5,
    projectCount: 1,
  },
];

const allMembers: TeamMember[] = [
  { id: "M001", name: "赵六", role: "组长", team: "图像标注一组", status: "online", todayTasks: 120, completed: 98, quality: "98.2%" },
  { id: "M002", name: "钱七", role: "组长", team: "语音转写组", status: "online", todayTasks: 80, completed: 65, quality: "96.5%" },
  { id: "M003", name: "孙八", role: "质检负责人", team: "质检组", status: "busy", todayTasks: 200, completed: 180, quality: "99.1%" },
  { id: "M004", name: "周十一", role: "标注员", team: "图像标注一组", status: "online", todayTasks: 100, completed: 72, quality: "97.5%" },
  { id: "M005", name: "吴十二", role: "标注员", team: "图像标注一组", status: "online", todayTasks: 100, completed: 85, quality: "98.8%" },
  { id: "M006", name: "郑十三", role: "标注员", team: "图像标注一组", status: "offline", todayTasks: 100, completed: 40, quality: "96.2%" },
  { id: "M007", name: "王十四", role: "标注员", team: "图像标注一组", status: "online", todayTasks: 100, completed: 68, quality: "97.0%" },
  { id: "M008", name: "陈十五", role: "标注员", team: "语音转写组", status: "online", todayTasks: 60, completed: 48, quality: "95.8%" },
  { id: "M009", name: "林十六", role: "标注员", team: "语音转写组", status: "offline", todayTasks: 60, completed: 35, quality: "94.2%" },
  { id: "M010", name: "冯十七", role: "质检员", team: "质检组", status: "online", todayTasks: 150, completed: 120, quality: "98.5%" },
];

export default function SupplierTeamPage() {
  const { role } = useSupplierRole();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  if (role === "worker") {
    return (
      <div className="sPage">
        <div className="agentBanner">
          <span className="agentBannerIcon">🔒</span>
          <div>
            <strong>无访问权限</strong>
            <p>团队管理功能仅对供应商负责人开放</p>
          </div>
        </div>
        <div className="sEmptyState">
          <div className="sEmptyIcon">⛔</div>
          <p>您当前为员工角色，无权访问团队管理模块</p>
          <p style={{ color: "#697889", fontSize: 13 }}>如需查看，请联系供应商负责人</p>
        </div>
      </div>
    );
  }

  const filteredMembers = selectedTeam
    ? allMembers.filter((m) => m.team === selectedTeam)
    : allMembers;

  return (
    <div className="sPage">
      <div className="agentBanner sBanner">
        <span className="agentBannerIcon">👥</span>
        <div>
          <strong>团队管理</strong>
          <p>团队结构管理、成员信息查看与人员调配</p>
        </div>
      </div>

      <div className="workspaceStats">
        <div className="statCard">
          <span className="statIcon">🏢</span>
          <div><strong>{teams.length}</strong><span>团队总数</span></div>
        </div>
        <div className="statCard">
          <span className="statIcon">👥</span>
          <div><strong>{teams.reduce((s, t) => s + t.memberCount, 0)}</strong><span>成员总数</span></div>
        </div>
        <div className="statCard">
          <span className="statIcon">🟢</span>
          <div><strong>{teams.reduce((s, t) => s + t.onlineToday, 0)}</strong><span>今日在线</span></div>
        </div>
        <div className="statCard">
          <span className="statIcon">📁</span>
          <div><strong>{teams.reduce((s, t) => s + t.projectCount, 0)}</strong><span>承接项目</span></div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">团队列表</h3>
          <button className="primaryBtn">新增团队</button>
        </div>
        <div className="cardBody">
          <div className="sTeamGrid">
            {teams.map((team) => (
              <div
                className={`sTeamCard ${selectedTeam === team.name ? "selected" : ""}`}
                key={team.id}
                onClick={() => setSelectedTeam(selectedTeam === team.name ? null : team.name)}
              >
                <div className="sTeamCardHeader">
                  <strong>{team.name}</strong>
                  <span className="pill small" style={{
                    background: "#e8f5e9",
                    color: "#2e7d32",
                  }}>活跃</span>
                </div>
                <div className="sTeamCardBody">
                  <div className="sTeamStat">
                    <span>负责人</span>
                    <strong>{team.leader}</strong>
                  </div>
                  <div className="sTeamStat">
                    <span>成员</span>
                    <strong>{team.memberCount} 人</strong>
                  </div>
                  <div className="sTeamStat">
                    <span>活跃</span>
                    <strong>{team.activeCount} 人</strong>
                  </div>
                  <div className="sTeamStat">
                    <span>今日在线</span>
                    <strong style={{ color: "#2e7d32" }}>{team.onlineToday} 人</strong>
                  </div>
                  <div className="sTeamStat">
                    <span>承接项目</span>
                    <strong>{team.projectCount} 个</strong>
                  </div>
                </div>
                <div className="sTeamCardFooter">
                  <button className="ghostBtn" onClick={(e) => { e.stopPropagation(); setSelectedTeam(team.name); }}>查看成员</button>
                  <button className="ghostBtn" onClick={(e) => e.stopPropagation()}>编辑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">
            {selectedTeam ? `${selectedTeam} - 成员列表` : "全部成员"}
          </h3>
          <div className="opTableActions">
            <input type="text" placeholder="搜索成员..." className="ghostBtn" style={{ width: 160 }} />
            <button className="primaryBtn">邀请成员</button>
          </div>
        </div>
        <div className="cardBody noPadding">
          <div className="projectTable">
            <div className="tableHeadRow">
              <div>姓名</div>
              <div>角色</div>
              <div>所属团队</div>
              <div>状态</div>
              <div>今日任务</div>
              <div>已完成</div>
              <div>完成率</div>
              <div>质量</div>
              <div>操作</div>
            </div>
            {filteredMembers.map((m) => {
              const rate = m.todayTasks > 0 ? Math.round(m.completed / m.todayTasks * 100) : 0;
              return (
                <div className="tableDataRow" key={m.id}>
                  <div><strong>{m.name}</strong></div>
                  <div><span className="tinyTag">{m.role}</span></div>
                  <div style={{ color: "#697889" }}>{m.team}</div>
                  <div>
                    <span className="pill small"
                      style={{
                        background: m.status === "online" ? "#e8f5e9" : m.status === "busy" ? "#fff3e0" : "#f5f5f5",
                        color: m.status === "online" ? "#2e7d32" : m.status === "busy" ? "#e65100" : "#9e9e9e",
                      }}
                    >{m.status === "online" ? "在线" : m.status === "busy" ? "忙碌" : "离线"}</span>
                  </div>
                  <div className="mono">{m.todayTasks}</div>
                  <div className="mono">{m.completed}</div>
                  <div>
                    <div className="sProgressBar" style={{ width: 60 }}>
                      <div className="sProgressFill" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                  <div><span style={{ color: parseFloat(m.quality) >= 97 ? "#2e7d32" : "#e65100" }}>{m.quality}</span></div>
                  <div>
                    <button className="linkBtn">编辑</button>
                    <button className="linkBtn">分配任务</button>
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
